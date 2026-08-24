import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Activity, ArrowLeft, ArrowRight, CheckCircle2, Download, FileText, Fingerprint, Radio, Receipt, RefreshCw, Save, ShieldAlert, Smartphone, Upload, Wallet, Wifi, X, Zap } from "lucide-react";
import { getWpcEtaConfiguration, getWpcEtaLedger, getWpcEtaQuote, getWpcEtaRequests,
  downloadWpcEtaDocument, removeWpcEtaDocument, saveWpcEtaDraft, submitWpcEta, uploadWpcEtaDocument } from "../../services/wpcEtaService";

const emptyFile = { status: "Not Uploaded", name: null };
export default function WpcEtaWorkflow({ service, onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [requestMode, setRequestMode] = useState("eta");
  const [modelNumber, setModelNumber] = useState("");
  const [frequencyRange, setFrequencyRange] = useState("");
  const [outputPower, setOutputPower] = useState("");
  const [files, setFiles] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const skipQuote = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([getWpcEtaConfiguration(), getWpcEtaRequests(), getWpcEtaLedger()])
      .then(async ([config, requestData, ledgerData]) => {
        const draft = requestData.requests?.find((item) => item.status === "DRAFT");
        const body = draft?.payload || {};
        const mode = body.requestMode || "eta";
        const quoteData = await getWpcEtaQuote(mode);
        if (!active) return;
        const restored = Object.fromEntries((config.service.documents || []).map((item) => [item.id, { ...emptyFile }]));
        for (const document of draft?.documents || []) restored[document.documentKey] = { status: "Uploaded", name: document.name, size: Number(document.size || 0) };
        setConfiguration(config); setLedger(ledgerData); setQuote(quoteData); skipQuote.current = true;
        setRequestMode(mode); setRequestId(draft?.id || null); setDraftCode(draft?.request_code || "");
        setModelNumber(body.modelNumber || ""); setFrequencyRange(body.frequencyRange || "");
        setOutputPower(body.outputPower || ""); setFiles(restored);
      }).catch(() => active && setError("Unable to load WPC ETA Authorization."))
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing) return;
    if (skipQuote.current) { skipQuote.current = false; return; }
    setQuoteLoading(true);
    getWpcEtaQuote(requestMode).then(setQuote)
      .catch(() => setError("Unable to calculate WPC pricing."))
      .finally(() => setQuoteLoading(false));
  }, [requestMode, initializing]);

  const config = configuration?.service;
  const entity = configuration?.entity || {};
  const documents = useMemo(() => (config?.documents || []).filter((item) => !item.requestModes || item.requestModes.includes(requestMode)), [config, requestMode]);
  const payload = () => ({ requestId, requestMode, modelNumber, frequencyRange, outputPower,
    gsrCompliance: config?.gsrCompliance, documents: files });
  const valid = Boolean(modelNumber && (requestMode !== "eta" || (frequencyRange && Number(outputPower) > 0)) &&
    documents.filter((item) => item.required).every((item) => files[item.id]?.status === "Uploaded"));
  const highPower = requestMode === "eta" && Number(outputPower) > 20 && /2\.4/i.test(frequencyRange);

  function validationMessage() {
    if (!modelNumber.trim()) return "Enter the equipment model number.";
    if (requestMode === "eta" && !frequencyRange.trim()) return "Enter the operating frequency range.";
    if (requestMode === "eta" && (!outputPower || Number(outputPower) <= 0 || Number(outputPower) > 1000)) {
      return "Enter a valid RF output power between 0 and 1000 dBm.";
    }
    const missingDocument = documents.find((item) => item.required && files[item.id]?.status !== "Uploaded");
    return missingDocument ? `Upload the required document: ${missingDocument.label}.` : "";
  }

  async function ensureDraft() {
    if (requestId) return requestId;
    const data = await saveWpcEtaDraft(payload()); setRequestId(data.request.id); setDraftCode(data.request.request_code); return data.request.id;
  }
  async function selectFile(key, event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try { setUploading(key); const id = await ensureDraft(); const data = await uploadWpcEtaDocument(id, key, file);
      setFiles((current) => ({ ...current, [key]: { status: "Uploaded", name: data.document.name, size: data.document.size } }));
    } catch (e) { Swal.fire("Upload failed", e.response?.data?.message || "The document could not be uploaded.", "error"); }
    finally { setUploading(""); }
  }
  async function removeFile(key) {
    if (!requestId) return;
    try { setUploading(key); await removeWpcEtaDocument(requestId, key); setFiles((current) => ({ ...current, [key]: { ...emptyFile } })); }
    catch (e) { Swal.fire("Unable to remove document", e.response?.data?.message || "Please try again.", "error"); }
    finally { setUploading(""); }
  }
  async function saveDraft() {
    try { setBusy(true); const data = await saveWpcEtaDraft(payload()); setRequestId(data.request.id); setDraftCode(data.request.request_code);
      await Swal.fire({ icon: "success", title: "WPC draft saved", text: `${data.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" }); }
    catch (e) { Swal.fire("Unable to save draft", e.response?.data?.message || "Please try again.", "error"); } finally { setBusy(false); }
  }
  async function submit() {
    const invalidMessage = validationMessage();
    if (invalidMessage) {
      await Swal.fire({ icon: "error", title: "WPC request is incomplete", text: invalidMessage, confirmButtonColor: "#2952ff" });
      return;
    }
    try { setBusy(true); const data = await submitWpcEta(payload()); const [nextQuote, nextLedger] = await Promise.all([getWpcEtaQuote(requestMode), getWpcEtaLedger()]);
      setQuote(nextQuote); setLedger(nextLedger); window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance } }));
      await Swal.fire({ icon: "success", title: "WPC request submitted", text: `${data.request.request_code} has been sent to the admin team.`, confirmButtonColor: "#2952ff" }); onBack();
    } catch (e) {
      if (e.response?.status === 402) { const code = e.response?.data?.errors?.code;
        const message = code === "INSUFFICIENT_WALLET" ? "Wallet balance is insufficient. Please top up your Wallet." : code === "INSUFFICIENT_CREDIT_LINE" ? "Credit Line balance is insufficient. Please top up your Credit Line." : "Wallet and Credit Line balances are insufficient. Please top up both.";
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text: message, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else Swal.fire("Unable to submit WPC request", e.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  }

  async function downloadFile(key) {
    if (!requestId || !files[key]?.name) return;
    try {
      await downloadWpcEtaDocument(requestId, key, files[key].name);
    } catch (e) {
      Swal.fire("Unable to download document", e.response?.data?.message || "Please try again.", "error");
    }
  }

  if (initializing) return <div className="mx-auto max-w-7xl p-6"><div className="min-h-[700px] animate-pulse rounded-[30px] bg-white shadow-lg" /></div>;
  const costs = quote || {};
  return <div className="min-h-[calc(100vh-7rem)]"><div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
    {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
    {draftCode && <div className="mb-3 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900"><Save size={17}/><div><b className="text-xs">Draft {draftCode} restored</b><p className="text-[11px] text-blue-600">Continue your WPC authorization request.</p></div></div>}
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
      <header className="flex justify-between border-b p-5"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5f63f2] text-white shadow-lg"><Radio/></div><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Back to Compliance</button><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">{config?.name || service.title}</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">{config?.transactionType}</span></div><p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><Fingerprint size={11} className="text-[#5f63f2]"/>{draftCode || "Tracking ID generated on save"}<Zap size={11} className="text-amber-500"/> Priority filing</p></div></div><button onClick={onBack} aria-label="Close WPC workflow"><X className="text-slate-400"/></button></header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-slate-50/70 px-5 py-3 text-[10px] font-black uppercase tracking-[.14em] text-slate-500"><span className="flex items-center gap-2"><RefreshCw size={12}/> Entity: {entity.companyName || "Company profile"}{entity.iecNumber ? ` · IEC ${entity.iecNumber}` : ""}</span><span className="text-[#5f63f2]">RF performance audit mode</span></div>
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]"><div className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">{(config?.requestModes || []).map((mode) => <button key={mode.id} onClick={() => setRequestMode(mode.id)} className={`rounded-xl px-3 py-3 ${requestMode === mode.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><b className="block text-xs uppercase">{mode.label}</b><span className="text-[9px] uppercase">{mode.description}</span></button>)}</div>
        <div className="grid gap-3 md:grid-cols-2"><Field label="Equipment Model Number" icon={<Smartphone size={12}/>} required><input maxLength={100} value={modelNumber} onChange={(e) => setModelNumber(e.target.value.toUpperCase())} placeholder="E.g. BT-99-PRO"/></Field>{requestMode === "eta" && <><Field label="Frequency Range" icon={<Wifi size={12}/>} required><input maxLength={120} value={frequencyRange} onChange={(e) => setFrequencyRange(e.target.value)} placeholder="E.g. 2400–2483.5 MHz"/></Field><Field label="Peak Output Power (dBm)" icon={<Activity size={12}/>} required><input type="number" min="0.01" max="1000" step="0.01" value={outputPower} onChange={(e) => setOutputPower(e.target.value)} placeholder="E.g. 19.5"/></Field></>}<Field label="GSR Delicensing"><input readOnly value={config?.gsrCompliance || "Compliant with Gazetted Norms"}/></Field></div>
        {highPower && <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"><ShieldAlert size={18}/><p className="text-[11px] font-semibold"><b>RF Spectrum Alert:</b> Power exceeds 20 dBm for the entered 2.4 GHz range. Confirm spectrum eligibility before filing.</p></div>}
        <div><h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14}/> Required RF evidence</h2><div className="space-y-2">{documents.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-slate-300"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${files[document.id]?.status === "Uploaded" ? "bg-emerald-50 text-emerald-500" : "bg-slate-50 text-slate-400"}`}>{files[document.id]?.status === "Uploaded" ? <CheckCircle2 size={20}/> : <FileText size={20}/>}</div><div className="min-w-0 flex-1"><b className="block text-xs uppercase">{document.label}{document.required && <em className="ml-2 not-italic text-[9px] text-rose-500">REQUIRED</em>}</b><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "PDF, DOC, DOCX, JPG or PNG · maximum 10 MB"}</span></div>{files[document.id]?.status === "Uploaded" && <><button type="button" onClick={() => downloadFile(document.id)} aria-label={`Download ${document.label}`} className="rounded-lg p-2 text-[#5f63f2] hover:bg-indigo-50"><Download size={16}/></button><button type="button" onClick={() => removeFile(document.id)} className="text-[10px] font-black uppercase text-rose-500">Remove</button></>}<label className={`rounded-lg border bg-slate-50 px-4 py-2 text-[10px] font-black uppercase ${uploading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input disabled={Boolean(uploading)} className="sr-only" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => selectFile(document.id, e)}/></label></article>)}</div></div>
      </div><aside className={`overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl xl:sticky xl:top-24 xl:self-start ${quoteLoading ? "opacity-80" : ""}`}><div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16}/><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div><div className="space-y-5 p-5"><Ledger title="Prepaid Wallet" balance={costs.openingWalletBalance} lines={[["WPC Official Fee", costs.officialFee]]} after={costs.closingWalletBalance}/><Ledger title="Corporate Credit Line" balance={costs.currentCreditLimit} lines={[["Application Drafting", costs.draftingFee], ["Zero-Rejection Premium", costs.successPremium], ["GST", costs.gst]]} after={costs.availableCreditAfter}/></div><div className="flex justify-between bg-[#2952ff] p-5"><div><span className="text-[9px] font-black uppercase text-blue-100">Total Authorization Debit</span><b className="block text-2xl">₹{Number(costs.total || 0).toLocaleString("en-IN")}</b></div><span className="text-right text-[9px] uppercase text-white/70">SLA: {config?.sla}<br/>{ledger.transactions.length} ledger entries</span></div></aside></div>
      <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex flex-col gap-3 sm:flex-row"><button onClick={saveDraft} disabled={busy || Boolean(uploading)} className="flex items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold disabled:opacity-50"><Save size={16}/> Save Draft</button><button onClick={submit} disabled={busy || Boolean(uploading)} className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black disabled:opacity-50 ${valid ? "bg-[#5f63f2] text-white" : "border border-slate-200 bg-slate-100 text-slate-500"}`}>{valid ? "Confirm RF Audit" : "Review Missing Fields"}<ArrowRight size={16}/></button></div></footer>
    </div></div></div>;
}
function Field({ label, children, icon = null, required = false }) { return <label className="space-y-1.5"><span className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{icon}{label}{required && <em className="not-italic text-rose-500">*</em>}</span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ title, balance, lines, after }) { return <div><div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14}/></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><b>₹{Number(balance || 0).toLocaleString("en-IN")}</b></div>{lines.map(([label, amount]) => <div key={label} className="flex justify-between border-t border-white/10 pt-2"><span className="text-slate-400">{label}</span><b className="text-rose-400">- ₹{Number(amount || 0).toLocaleString("en-IN")}</b></div>)}<div className="flex justify-between border-t border-white/10 pt-2"><span className="text-blue-400">Available Post-Task</span><b>₹{Number(after || 0).toLocaleString("en-IN")}</b></div></div></div>; }
