import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Activity, AlertTriangle, ArrowLeft, ArrowRight, Download, FileText, FlaskConical, Pill, Receipt, Save, ShieldAlert, Stethoscope, Upload, Wallet, X, Zap } from "lucide-react";
import { downloadCdscoDocument, getCdscoConfiguration, getCdscoLedger, getCdscoQuote, getCdscoRequests, removeCdscoDocument, saveCdscoDraft, submitCdsco, uploadCdscoDocument } from "../../services/cdscoService";

const emptyFile = { status: "Not Uploaded", name: null };

export default function CdscoImportAuthorizationWorkflow({ onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [requestMode, setRequestMode] = useState("medical-device");
  const [deviceClass, setDeviceClass] = useState("B");
  const [manufacturingCountry, setManufacturingCountry] = useState("");
  const [files, setFiles] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getCdscoConfiguration(), getCdscoRequests(), getCdscoLedger()])
      .then(async ([config, requestData, ledgerData]) => {
        const draft = requestData.requests?.find((item) => item.status === "DRAFT");
        const body = draft?.payload || {};
        const mode = body.requestMode || "medical-device";
        const classification = body.deviceClass || "B";
        const quoteData = await getCdscoQuote(mode, classification);
        if (!active) return;
        const restored = Object.fromEntries((config.service.documents || []).map((item) => [item.id, { ...emptyFile }]));
        for (const document of draft?.documents || []) restored[document.documentKey] = { status: "Uploaded", name: document.name, size: Number(document.size || 0) };
        setConfiguration(config); setLedger(ledgerData); setQuote(quoteData); setRequestMode(mode); setDeviceClass(classification);
        setRequestId(draft?.id || null); setDraftCode(draft?.request_code || ""); setManufacturingCountry(body.manufacturingCountry || ""); setFiles(restored);
      }).catch(() => active && setError("Unable to load CDSCO Import Authorization."))
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing) return;
    getCdscoQuote(requestMode, deviceClass).then(setQuote).catch(() => setError("Unable to calculate CDSCO pricing."));
  }, [requestMode, deviceClass, initializing]);

  const config = configuration?.service;
  const documents = useMemo(() => (config?.documents || []).filter((item) => !item.requestModes || item.requestModes.includes(requestMode)), [config, requestMode]);
  const payload = () => ({ requestId, requestMode, deviceClass, manufacturingCountry, indianAgent: config?.indianAgent, documents: files });
  const valid = Boolean(manufacturingCountry.trim() && documents.filter((item) => item.required).every((item) => files[item.id]?.status === "Uploaded"));
  const highRisk = requestMode === "medical-device" && ["C", "D"].includes(deviceClass);
  const validationMessage = () => {
    if (!manufacturingCountry.trim()) return "Enter the manufacturing country.";
    const missing = documents.find((item) => item.required && files[item.id]?.status !== "Uploaded");
    return missing ? `Upload the required document: ${missing.label}.` : "";
  };

  async function ensureDraft() {
    if (requestId) return requestId;
    const data = await saveCdscoDraft(payload()); setRequestId(data.request.id); setDraftCode(data.request.request_code); return data.request.id;
  }
  async function selectFile(key, event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try { setUploading(key); const id = await ensureDraft(); const data = await uploadCdscoDocument(id, key, file); setFiles((current) => ({ ...current, [key]: { status: "Uploaded", name: data.document.name, size: data.document.size } })); }
    catch (e) { Swal.fire("Upload failed", e.response?.data?.message || "The document could not be uploaded.", "error"); } finally { setUploading(""); }
  }
  async function removeFile(key) {
    if (!requestId) return;
    try { setUploading(key); await removeCdscoDocument(requestId, key); setFiles((current) => ({ ...current, [key]: { ...emptyFile } })); }
    catch (e) { Swal.fire("Unable to remove document", e.response?.data?.message || "Please try again.", "error"); } finally { setUploading(""); }
  }
  async function downloadFile(key) {
    if (!requestId) return;
    try { await downloadCdscoDocument(requestId, key, files[key]?.name); }
    catch (e) { Swal.fire("Unable to download document", e.response?.data?.message || "Please try again.", "error"); }
  }
  async function saveDraft() {
    try { setBusy(true); const data = await saveCdscoDraft(payload()); setRequestId(data.request.id); setDraftCode(data.request.request_code); await Swal.fire({ icon: "success", title: "CDSCO draft saved", text: `${data.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" }); }
    catch (e) { Swal.fire("Unable to save draft", e.response?.data?.message || "Please try again.", "error"); } finally { setBusy(false); }
  }
  async function submit() {
    const message = validationMessage();
    if (message) { await Swal.fire({ icon: "error", title: "CDSCO dossier is incomplete", text: message, confirmButtonColor: "#2952ff" }); return; }
    try { setBusy(true); const data = await submitCdsco(payload()); const [nextQuote, nextLedger] = await Promise.all([getCdscoQuote(requestMode, deviceClass), getCdscoLedger()]); setQuote(nextQuote); setLedger(nextLedger); window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance } })); await Swal.fire({ icon: "success", title: "CDSCO request submitted", text: `${data.request.request_code} has been sent to the Admin Request Board.`, confirmButtonColor: "#2952ff" }); onBack(); }
    catch (e) { if (e.response?.status === 402) { const code = e.response?.data?.errors?.code; const message = code === "INSUFFICIENT_WALLET" ? "Wallet balance is insufficient. Please top up your Wallet." : code === "INSUFFICIENT_CREDIT_LINE" ? "Credit Line balance is insufficient. Please top up your Credit Line." : "Wallet and Credit Line balances are insufficient. Please top up both."; const result = await Swal.fire({ icon: "warning", title: "Top up required", text: message, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" }); if (result.isConfirmed) navigate("/client/wallet-credit#add-credit"); } else Swal.fire("Unable to submit CDSCO request", e.response?.data?.message || "Please try again.", "error"); } finally { setBusy(false); }
  }

  if (initializing) return <div className="mx-auto max-w-7xl p-6"><div className="min-h-[700px] animate-pulse rounded-[30px] bg-white shadow-lg" /></div>;
  const costs = quote || {};
  return <div className="min-h-[calc(100vh-7rem)]"><div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
    {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
    {draftCode && <div className="mb-3 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900"><Save size={17}/><div><b className="text-xs">Draft {draftCode} restored</b><p className="text-[11px] text-blue-600">Continue your CDSCO authorization request.</p></div></div>}
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
      <header className="flex justify-between border-b p-5"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white">{requestMode === "medical-device" ? <Stethoscope/> : requestMode === "drug" ? <Pill/> : <FlaskConical/>}</div><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Back to Compliance</button><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">CDSCO Import Authorization</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">{config?.transactionType}</span></div><p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">IEC {configuration?.identity?.iecNumber || "Pending"} · MDR-Compliance Mode <Zap size={11} className="text-amber-500"/> SEC Priority</p></div></div><button onClick={onBack}><X className="text-slate-400"/></button></header>
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]"><div className="space-y-5">
        <div className="grid gap-2 rounded-2xl bg-slate-100 p-1 md:grid-cols-3">{(config?.requestModes || []).map((mode) => <button key={mode.id} onClick={() => setRequestMode(mode.id)} className={`rounded-xl px-3 py-3 ${requestMode === mode.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><b className="block text-xs uppercase">{mode.label}</b><span className="text-[9px] uppercase">{mode.description}</span></button>)}</div>
        <div className="grid gap-3 md:grid-cols-2"><Field label="Manufacturing Country"><input value={manufacturingCountry} onChange={(e) => setManufacturingCountry(e.target.value)} placeholder="Country of Origin"/></Field>{requestMode === "medical-device" ? <Field label="Device Classification"><div className="grid grid-cols-4 gap-2">{(config?.medicalDeviceClasses || []).map((item) => <button type="button" key={item.value} onClick={() => setDeviceClass(item.value)} className={`rounded-xl border py-3 text-[10px] font-black ${deviceClass === item.value ? "border-[#2952ff] bg-blue-50 text-[#2952ff]" : "border-slate-200 text-slate-400"}`}>CLASS {item.value}</button>)}</div></Field> : <Field label="Indian Agent Details"><input readOnly value={config?.indianAgent || "Linked Authorized Agent"}/></Field>}</div>
        <div className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"><Activity className="shrink-0 text-[#2952ff]" size={20}/><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dossier Audit Strategy</p><p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700">{highRisk ? "High-risk audit initiated. Clinical Evaluation and Biological Safety data will be reconciled for Subject Expert Committee scrutiny." : `Standard ${requestMode} registration. The Plant Master File will be checked against Schedule M / ISO 13485 requirements.`}</p></div></div>
        <div><h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14}/> Required regulatory dossier</h2><div className="space-y-2">{documents.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className={files[document.id]?.status === "Uploaded" ? "text-emerald-500" : "text-slate-400"}/><div className="min-w-0 flex-1"><b className="block text-xs uppercase">{document.label}{document.required && <em className="ml-2 not-italic text-[9px] text-rose-500">REQUIRED</em>}</b><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "Awaiting CDSCO evidence"}</span></div>{files[document.id]?.status === "Uploaded" && <button onClick={() => downloadFile(document.id)} className="rounded-lg p-2 text-[#2952ff]" aria-label={`Download ${document.label}`}><Download size={16}/></button>}{files[document.id]?.status === "Uploaded" && <button onClick={() => removeFile(document.id)} className="text-[10px] font-black uppercase text-rose-500">Remove</button>}<label className="cursor-pointer rounded-lg border bg-slate-50 px-4 py-2 text-[10px] font-black uppercase">{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input className="sr-only" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => selectFile(document.id, e)}/></label></article>)}</div></div><div className="mt-3 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-800"><ShieldAlert className="shrink-0" size={18}/><p className="text-[10px] font-black uppercase leading-relaxed">Clinical Guard: For {highRisk ? "high-risk" : "standard"} devices, mismatches between foreign clinical data and required Indian bridge evidence may result in rejection.</p></div>
      </div><aside className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl xl:sticky xl:top-24 xl:self-start"><div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16}/><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div><div className="space-y-5 p-5"><Ledger title="Prepaid Wallet" balance={costs.openingWalletBalance} lines={[["CDSCO Official Fee", costs.officialFee]]} after={costs.closingWalletBalance}/><Ledger title="Corporate Credit Line" balance={costs.currentCreditLimit} lines={[["Application Drafting", costs.draftingFee], ["Compliance Shield", costs.shieldPremium], ["GST (18%)", costs.gst]]} after={costs.availableCreditAfter}/></div><div className="flex justify-between bg-[#2952ff] p-5"><div><span className="text-[9px] font-black uppercase text-blue-100">Total Authorization Debit</span><b className="block text-2xl">₹{Number(costs.total || 0).toLocaleString("en-IN")}</b></div><span className="text-right text-[9px] uppercase text-white/70">SLA: {config?.sla}<br/>{ledger.transactions.length} ledger entries</span></div></aside></div>
      <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex gap-3"><button onClick={saveDraft} disabled={busy} className="flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"><Save size={16}/> Save Draft</button><button onClick={submit} disabled={busy} className={`flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-[#2952ff] text-white" : "bg-slate-200 text-slate-400"}`}>{valid ? "Confirm & File CDSCO" : "Incomplete Audit"}<ArrowRight size={16}/></button></div></footer>
    </div></div></div>;
}

function Field({ label, children }) { return <label className="space-y-1.5"><span className="px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{label}</span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ title, balance, lines, after }) { return <div><div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14}/></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><b>₹{Number(balance || 0).toLocaleString("en-IN")}</b></div>{lines.map(([label, amount]) => <div key={label} className="flex justify-between border-t border-white/10 pt-2"><span className="text-slate-400">{label}</span><b className="text-rose-400">- ₹{Number(amount || 0).toLocaleString("en-IN")}</b></div>)}<div className="flex justify-between border-t border-white/10 pt-2"><span className="text-blue-400">Available Post-Task</span><b>₹{Number(after || 0).toLocaleString("en-IN")}</b></div></div></div>; }
