import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, ArrowRight, Building2, FileText, Receipt, Save, ShieldCheck, Upload, Wallet, X, Zap } from "lucide-react";
import {
  getIgcrConfiguration,
  getIgcrLedger,
  getIgcrQuote,
  getIgcrRequests,
  removeIgcrDocument,
  saveIgcrDraft,
  submitIgcr,
  uploadIgcrDocument,
} from "../../services/igcrReturnService";

const emptyFile = { status: "Not Uploaded", name: null };

export default function IgcrReturnWorkflow({ service, onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [requestType, setRequestType] = useState("monthly");
  const [igcrId, setIgcrId] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [boeCount, setBoeCount] = useState("");
  const [consumptionValue, setConsumptionValue] = useState("");
  const [files, setFiles] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState("");
  const skipQuote = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([getIgcrConfiguration(), getIgcrRequests(), getIgcrLedger()])
      .then(async ([config, requestData, ledgerData]) => {
        const draft = requestData.requests?.find((item) => item.status === "DRAFT");
        const body = draft?.payload || {};
        const type = body.requestType || "monthly";
        const quoteData = await getIgcrQuote(type);
        if (!active) return;
        const restored = Object.fromEntries((config.service.documents || []).map((item) => [item.id, { ...emptyFile }]));
        for (const document of draft?.documents || []) {
          restored[document.documentKey] = { status: "Uploaded", name: document.name, size: Number(document.size || 0) };
        }
        setConfiguration(config);
        setLedger(ledgerData);
        setQuote(quoteData);
        skipQuote.current = true;
        setRequestType(type);
        setRequestId(draft?.id || null);
        setDraftCode(draft?.request_code || "");
        setIgcrId(body.igcrId || "");
        setReportingPeriod(body.reportingPeriod || "");
        setBoeCount(body.boeCount || "");
        setConsumptionValue(body.consumptionValue || "");
        setFiles(restored);
      })
      .catch(() => active && setError("Unable to load IGCR Returns."))
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing) return;
    if (skipQuote.current) { skipQuote.current = false; return; }
    setQuoteLoading(true);
    getIgcrQuote(requestType)
      .then(setQuote)
      .catch(() => setError("Unable to calculate IGCR pricing."))
      .finally(() => setQuoteLoading(false));
  }, [requestType, initializing]);

  const config = configuration?.service;
  const documents = useMemo(
    () => (config?.documents || []).filter((item) => !item.requestTypes || item.requestTypes.includes(requestType)),
    [config, requestType],
  );
  const payload = () => ({
    requestId,
    requestType,
    igcrId: igcrId.trim(),
    reportingPeriod,
    boeCount: Number(boeCount || 0),
    consumptionValue: Number(consumptionValue || 0),
    documents: files,
  });
  const valid = Boolean(
    igcrId.trim() && reportingPeriod && Number(boeCount) > 0 &&
    documents.filter((item) => item.required).every((item) => files[item.id]?.status === "Uploaded"),
  );

  async function ensureDraft() {
    if (requestId) return requestId;
    const data = await saveIgcrDraft(payload());
    setRequestId(data.request.id);
    setDraftCode(data.request.request_code);
    return data.request.id;
  }
  async function selectFile(key, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setUploading(key);
      const id = await ensureDraft();
      const data = await uploadIgcrDocument(id, key, file);
      setFiles((current) => ({ ...current, [key]: { status: "Uploaded", name: data.document.name, size: data.document.size } }));
    } catch (e) {
      Swal.fire("Upload failed", e.response?.data?.message || "The document could not be uploaded.", "error");
    } finally { setUploading(""); }
  }
  async function removeFile(key) {
    if (!requestId) return;
    try {
      setUploading(key);
      await removeIgcrDocument(requestId, key);
      setFiles((current) => ({ ...current, [key]: { ...emptyFile } }));
    } catch (e) {
      Swal.fire("Unable to remove document", e.response?.data?.message || "Please try again.", "error");
    } finally { setUploading(""); }
  }
  async function saveDraft() {
    try {
      setBusy(true);
      const data = await saveIgcrDraft(payload());
      setRequestId(data.request.id);
      setDraftCode(data.request.request_code);
      await Swal.fire({ icon: "success", title: "IGCR draft saved", text: `${data.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" });
    } catch (e) {
      Swal.fire("Unable to save draft", e.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  }
  async function submit() {
    if (!valid) return;
    try {
      setBusy(true);
      const data = await submitIgcr(payload());
      const [nextQuote, nextLedger] = await Promise.all([getIgcrQuote(requestType), getIgcrLedger()]);
      setQuote(nextQuote);
      setLedger(nextLedger);
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance } }));
      await Swal.fire({ icon: "success", title: "IGCR return submitted", text: `${data.request.request_code} has been sent to the admin team.`, confirmButtonColor: "#2952ff" });
      onBack();
    } catch (e) {
      if (e.response?.status === 402) {
        const code = e.response?.data?.errors?.code;
        const message = code === "INSUFFICIENT_WALLET" ? "Wallet balance is insufficient. Please top up your Wallet." : code === "INSUFFICIENT_CREDIT_LINE" ? "Credit Line balance is insufficient. Please top up your Credit Line." : "Wallet and Credit Line balances are insufficient. Please top up both.";
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text: message, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else {
        Swal.fire("Unable to submit IGCR return", e.response?.data?.message || "Please try again.", "error");
      }
    } finally { setBusy(false); }
  }

  if (initializing) return <div className="mx-auto max-w-7xl p-6"><div className="min-h-[700px] animate-pulse rounded-[30px] bg-white shadow-lg" /></div>;
  const costs = quote || {};
  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
        {draftCode && <div className="mb-3 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900"><Save size={17} /><div><b className="text-xs">Draft {draftCode} restored</b><p className="text-[11px] text-blue-600">Continue your IGCR filing.</p></div></div>}
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
          <header className="flex justify-between border-b p-5">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white"><ShieldCheck /></div>
              <div>
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16} /> Back to Compliance</button>
                <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">{config?.name || service.title}</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">{config?.transactionType}</span></div>
                <p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{config?.standard}<Zap size={11} className="text-amber-500" /> {config?.priorityLabel || "Priority SLA"}</p>
              </div>
            </div>
            <button onClick={onBack}><X className="text-slate-400" /></button>
          </header>
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                {(config?.requestTypes || []).map((mode) => <button key={mode.id} onClick={() => setRequestType(mode.id)} className={`rounded-xl px-3 py-3 ${requestType === mode.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><b className="block text-xs uppercase">{mode.label}</b><span className="text-[9px] uppercase">{mode.description}</span></button>)}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Company"><input readOnly value={configuration?.clientContext?.companyName || "Company profile pending"} /></Field>
                <Field label="IEC / GST"><input readOnly value={[configuration?.clientContext?.iecNumber, configuration?.clientContext?.gstin].filter(Boolean).join(" • ") || "Profile identifiers pending"} /></Field>
                <Field label="IGCR Registration ID"><input value={igcrId} onChange={(e) => setIgcrId(e.target.value)} placeholder="E.g. IGCR/IEC/2026/001" /></Field>
                <Field label="Reporting Period"><select value={reportingPeriod} onChange={(e) => setReportingPeriod(e.target.value)}><option value="">Select period</option>{(config?.reportingPeriods || []).map((period) => <option key={period.value} value={period.value}>{period.label}</option>)}</select></Field>
                <Field label="Bills of Entry Covered"><input type="number" min="1" value={boeCount} onChange={(e) => setBoeCount(e.target.value)} placeholder="Number of BOEs" /></Field>
                <Field label="Consumption Value (INR)"><input type="number" min="0" value={consumptionValue} onChange={(e) => setConsumptionValue(e.target.value)} placeholder="Optional consumed value" /></Field>
              </div>
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14} /> Required IGCR evidence</h2>
                <div className="space-y-2">{documents.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className={files[document.id]?.status === "Uploaded" ? "text-emerald-500" : "text-slate-400"} /><div className="min-w-0 flex-1"><b className="block text-xs uppercase">{document.label}{document.required && <em className="ml-2 not-italic text-[9px] text-rose-500">REQUIRED</em>}</b><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "Awaiting compliance evidence"}</span>{document.sampleAvailable && <span className="text-[9px] font-bold uppercase text-blue-500">Sample available</span>}</div>{files[document.id]?.status === "Uploaded" && <button onClick={() => removeFile(document.id)} className="text-[10px] font-black uppercase text-rose-500">Remove</button>}<label className="cursor-pointer rounded-lg border bg-slate-50 px-4 py-2 text-[10px] font-black uppercase">{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input className="sr-only" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(e) => selectFile(document.id, e)} /></label></article>)}</div>
              </div>
            </div>
            <aside className={`overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl xl:sticky xl:top-24 xl:self-start ${quoteLoading ? "opacity-80" : ""}`}>
              <div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16} /><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div>
              <div className="space-y-5 p-5"><Ledger title="Prepaid Wallet" balance={costs.openingWalletBalance} lines={[["IGCR Official Fee", costs.officialFee]]} after={costs.closingWalletBalance} /><Ledger title="Corporate Credit Line" balance={costs.currentCreditLimit} lines={[["Return Drafting", costs.draftingFee], ["Nexus Integrity Premium", costs.shieldPremium], ["GST", costs.gst]]} after={costs.availableCreditAfter} /></div>
              <div className="flex justify-between bg-[#2952ff] p-5"><div><span className="text-[9px] font-black uppercase text-blue-100">Total IGCR Debit</span><b className="block text-2xl">₹{Number(costs.total || 0).toLocaleString("en-IN")}</b></div><span className="text-right text-[9px] uppercase text-white/70">SLA: {config?.sla}<br />{ledger.transactions.length} ledger entries</span></div>
            </aside>
          </div>
          <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex gap-3"><button onClick={saveDraft} disabled={busy} className="flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"><Save size={16} /> Save Draft</button><button onClick={submit} disabled={busy || !valid} className={`flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-[#2952ff] text-white" : "bg-slate-200 text-slate-400"}`}>{valid ? "Confirm & Submit" : "Incomplete Request"}<ArrowRight size={16} /></button></div></footer>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) { return <label className="space-y-1.5"><span className="flex items-center gap-1 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><Building2 size={12} />{label}</span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ title, balance, lines, after }) { return <div><div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14} /></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><b>₹{Number(balance || 0).toLocaleString("en-IN")}</b></div>{lines.map(([label, amount]) => <div key={label} className="flex justify-between border-t border-white/10 pt-2"><span className="text-slate-400">{label}</span><b className="text-rose-400">- ₹{Number(amount || 0).toLocaleString("en-IN")}</b></div>)}<div className="flex justify-between border-t border-white/10 pt-2"><span className="text-blue-400">Available Post-Task</span><b>₹{Number(after || 0).toLocaleString("en-IN")}</b></div></div></div>; }
