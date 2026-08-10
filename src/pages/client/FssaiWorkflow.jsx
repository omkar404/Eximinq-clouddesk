import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { AlertTriangle, ArrowLeft, ArrowRight, FileCheck2, FileText, Receipt, Save, ShieldCheck, Upload, Wallet, X, Zap } from "lucide-react";
import { getFssaiConfiguration, getFssaiLedger, getFssaiQuote, getFssaiRequests, removeFssaiDocument, saveFssaiDraft, submitFssai, uploadFssaiDocument } from "../../services/fssaiService";

const emptyFile = { status: "Not Uploaded", name: null };
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function FssaiWorkflow({ service, onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState({});
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [requestMode, setRequestMode] = useState("License");
  const [licenseType, setLicenseType] = useState("New");
  const [licenseRole, setLicenseRole] = useState("Importer");
  const [foodCategory, setFoodCategory] = useState("Standardized");
  const [shelfLifeRemaining, setShelfLifeRemaining] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [files, setFiles] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const config = await getFssaiConfiguration();
        const [requestsResult, ledgerResult] = await Promise.allSettled([getFssaiRequests(), getFssaiLedger()]);
        const data = requestsResult.status === "fulfilled" ? requestsResult.value : { requests: [] };
        const ledgerData = ledgerResult.status === "fulfilled" ? ledgerResult.value : { transactions: [] };
        const draft = data.requests?.find((item) => item.status === "DRAFT");
        const payload = draft?.payload || {};
        const mode = payload.requestMode || "License";
        let pricing = {};
        try { pricing = await getFssaiQuote(mode); } catch { pricing = {}; }
        if (!active) return;
        const restored = Object.fromEntries((config.service.documents || []).map((item) => [item.id, { ...emptyFile }]));
        for (const document of draft?.documents || []) restored[document.documentKey] = { status: "Uploaded", name: document.name, size: Number(document.size || 0) };
        setConfiguration(config); setQuote(pricing); setLedger(ledgerData); setRequestId(draft?.id || null); setDraftCode(draft?.request_code || "");
        setRequestMode(mode); setLicenseType(payload.licenseType || "New"); setLicenseRole(payload.licenseRole || "Importer"); setFoodCategory(payload.foodCategory || "Standardized");
        setShelfLifeRemaining(payload.shelfLifeRemaining ?? ""); setReportingPeriod(payload.reportingPeriod || config.service.reportingPeriod || ""); setFiles(restored); setError("");
      } catch { if (active) setError("Unable to load FSSAI Compliance Hub."); }
      finally { if (active) setInitializing(false); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing || !configuration) return undefined;
    const timer = setTimeout(() => getFssaiQuote(requestMode).then((data) => { setQuote(data); setError(""); }).catch(() => setError("Unable to calculate FSSAI fees.")), 200);
    return () => clearTimeout(timer);
  }, [requestMode, initializing, configuration]);

  const config = configuration?.service;
  const documents = useMemo(() => (config?.documents || []).filter((item) => (!item.modes || item.modes.includes(requestMode)) && (!item.licenseTypes || item.licenseTypes.includes(licenseType)) && (!item.licenseRoles || item.licenseRoles.includes(licenseRole))), [config, requestMode, licenseType, licenseRole]);
  const payload = () => ({ requestId, requestMode, licenseType, licenseRole, foodCategory, shelfLifeRemaining: shelfLifeRemaining === "" ? "" : Number(shelfLifeRemaining), reportingPeriod, documents: files });
  const valid = Boolean(foodCategory && (requestMode !== "FICS" || (Number(shelfLifeRemaining) >= 60 && Number(shelfLifeRemaining) <= 100)) && documents.filter((item) => item.required).every((item) => files[item.id]?.status === "Uploaded"));

  async function ensureDraft() { if (requestId) return requestId; const data = await saveFssaiDraft(payload()); setRequestId(data.request.id); setDraftCode(data.request.request_code); return data.request.id; }
  async function selectFile(key, event) { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; try { setUploading(key); const id = await ensureDraft(); const data = await uploadFssaiDocument(id, key, file); setFiles((current) => ({ ...current, [key]: { status: "Uploaded", name: data.document.name, size: data.document.size } })); } catch (e) { Swal.fire("Upload failed", e.response?.data?.message || "The document could not be uploaded.", "error"); } finally { setUploading(""); } }
  async function removeFile(key) { try { setUploading(key); await removeFssaiDocument(requestId, key); setFiles((current) => ({ ...current, [key]: { ...emptyFile } })); } catch (e) { Swal.fire("Unable to remove document", e.response?.data?.message || "Please try again.", "error"); } finally { setUploading(""); } }
  async function saveDraft() { try { setBusy(true); const data = await saveFssaiDraft(payload()); setRequestId(data.request.id); setDraftCode(data.request.request_code); await Swal.fire({ icon: "success", title: "FSSAI draft saved", text: `${data.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" }); } catch (e) { Swal.fire("Unable to save draft", e.response?.data?.message || "Please try again.", "error"); } finally { setBusy(false); } }
  async function submit() { if (!valid) return; try { setBusy(true); let id = requestId; if (!id) id = await ensureDraft(); const data = await submitFssai({ ...payload(), requestId: id }); const [pricing, nextLedger] = await Promise.all([getFssaiQuote(requestMode), getFssaiLedger()]); setQuote(pricing); setLedger(nextLedger); window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance } })); await Swal.fire({ icon: "success", title: "FSSAI request submitted", text: `${data.request.request_code} has been sent to the Admin Request Board.`, confirmButtonColor: "#2952ff" }); onBack(); } catch (e) { if (e.response?.status === 402) { const code = e.response?.data?.errors?.code; const message = code === "INSUFFICIENT_WALLET" ? "Wallet balance is insufficient. Please top up your Wallet." : code === "INSUFFICIENT_CREDIT_LINE" ? "Credit Line balance is insufficient. Please top up your Credit Line." : "Wallet and Credit Line balances are insufficient. Please top up both."; const result = await Swal.fire({ icon: "warning", title: "Top up required", text: message, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" }); if (result.isConfirmed) navigate("/client/wallet-credit#add-credit"); } else Swal.fire("Unable to submit request", e.response?.data?.message || "Please try again.", "error"); } finally { setBusy(false); } }

  if (initializing) return <div className="mx-auto max-w-7xl p-6"><div className="min-h-[700px] animate-pulse rounded-[30px] bg-white shadow-lg" /></div>;
  return <div className="min-h-[calc(100vh-7rem)]"><div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
    {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
    {draftCode && <div className="mb-3 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900"><Save size={17}/><div><b className="text-xs">Draft {draftCode} restored</b><p className="text-[11px] text-blue-600">Continue your FSSAI application.</p></div></div>}
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
      <header className="flex justify-between border-b p-5"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white"><ShieldCheck/></div><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Back to Compliance</button><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">{config?.name || service.title}</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">FoSCoS Compliance</span></div><p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{config?.standard}<Zap size={11} className="text-amber-500"/> Priority SLA</p></div></div><button onClick={onBack}><X className="text-slate-400"/></button></header>
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]"><div className="space-y-5">
        <div className="grid gap-2 rounded-2xl bg-slate-100 p-1 sm:grid-cols-2 lg:grid-cols-4">{(config?.requestModes || []).map((mode) => <button key={mode.id} onClick={() => setRequestMode(mode.id)} className={`rounded-xl px-3 py-3 ${requestMode === mode.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><b className="block text-xs uppercase">{mode.label}</b><span className="text-[9px] uppercase">{mode.description}</span></button>)}</div>
        <div className="grid gap-3 md:grid-cols-2"><Field label="Company / IEC"><input readOnly value={`${configuration?.identity?.companyName || "Client"} · ${configuration?.identity?.iecNumber || "IEC pending"}`}/></Field><Field label="Food Category"><select value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)}>{(config?.foodCategories || []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>{requestMode === "License" && <><Field label="License Application"><select value={licenseType} onChange={(e) => setLicenseType(e.target.value)}>{(config?.licenseTypes || []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Food Business Role"><select value={licenseRole} onChange={(e) => setLicenseRole(e.target.value)}>{(config?.licenseRoles || []).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field></>}{requestMode === "FICS" ? <Field label="Remaining Shelf Life (%)"><input type="number" min="60" max="100" value={shelfLifeRemaining} onChange={(e) => setShelfLifeRemaining(e.target.value)} placeholder="Minimum 60%"/></Field> : <Field label="Reporting Period"><input value={reportingPeriod} onChange={(e) => setReportingPeriod(e.target.value.toUpperCase())}/></Field>}</div>
        <div><h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14}/> Required regulatory evidence</h2><div className="space-y-2">{documents.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className={files[document.id]?.status === "Uploaded" ? "text-emerald-500" : "text-slate-400"}/><div className="min-w-0 flex-1"><b className="block text-xs uppercase">{document.label}{document.required && <em className="ml-2 not-italic text-[9px] text-rose-500">REQUIRED</em>}</b><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "Compliance file required"}</span></div>{files[document.id]?.status === "Uploaded" && <button onClick={() => removeFile(document.id)} className="text-[10px] font-black uppercase text-rose-500">Remove</button>}<label className="cursor-pointer rounded-lg border bg-slate-50 px-4 py-2 text-[10px] font-black uppercase">{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input className="sr-only" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => selectFile(document.id, event)}/></label></article>)}</div></div>
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><AlertTriangle size={18}/><p className="text-[11px] font-semibold">{requestMode === "Returns" ? "Annual returns should be filed by 31 May. Late filing may attract ₹100 per day per licence." : "All product, label and laboratory evidence must be current, complete and legible before FoSCoS submission."}</p></div>
      </div><aside className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl xl:sticky xl:top-24 xl:self-start"><div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16}/><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div><div className="space-y-5 p-5"><Ledger title="Prepaid Wallet" balance={quote.openingWalletBalance} lines={[["Official Filing Fee", quote.baseOfficial], ["Official GST", quote.officialGst]]} after={quote.closingWalletBalance}/><Ledger title="Corporate Credit Line" balance={quote.currentCreditLimit} lines={[["Compliance Service", quote.draftingFee], ["GST", quote.gst]]} after={quote.availableCreditAfter}/></div><div className="flex justify-between bg-[#2952ff] p-5"><div><span className="text-[9px] font-black uppercase text-blue-100">Total Application Debit</span><b className="block text-2xl">₹{money(quote.total)}</b></div><span className="text-right text-[9px] uppercase text-white/70">SLA: {config?.sla}<br/>{ledger.transactions.length} ledger entries</span></div></aside></div>
      <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex gap-3"><button onClick={saveDraft} disabled={busy} className="flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"><Save size={16}/> Save Draft</button><button onClick={submit} disabled={busy || !valid} className={`flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-[#2952ff] text-white" : "bg-slate-200 text-slate-400"}`}><FileCheck2 size={16}/>{valid ? "Submit FSSAI Request" : "Incomplete Application"}<ArrowRight size={16}/></button></div></footer>
    </div>
  </div></div>;
}

function Field({ label, children }) { return <label className="space-y-1.5"><span className="px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{label}</span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ title, balance, lines, after }) { return <div><div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14}/></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><b>₹{money(balance)}</b></div>{lines.map(([label, amount]) => <div key={label} className="flex justify-between border-t border-white/10 pt-2"><span className="text-slate-400">{label}</span><b className="text-rose-400">- ₹{money(amount)}</b></div>)}<div className="flex justify-between border-t border-white/10 pt-2"><span className="text-blue-400">Available Post-Task</span><b>₹{money(after)}</b></div></div></div>; }
