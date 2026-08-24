import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, ArrowRight, Award, CheckCircle2, Download, FileCheck, HardHat, Leaf, LoaderCircle, Lock, Database, Receipt, Save, ShieldCheck, Trash2, Upload, Users, X } from "lucide-react";
import { downloadLicensingDocument, getLicensingConfiguration, getLicensingLedger, getLicensingQuote, getLicensingRequests, removeLicensingDocument, saveLicensingDraft, submitLicensingRequest, uploadLicensingDocument } from "../../services/licensingService";

const SLUG = "iso-certification";
const money = value => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0));
const errorText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const keyOf = item => item?.document_key || item?.documentKey || "";
const nameOf = item => item?.original_name || item?.name || "Uploaded document";
const STANDARDS = [
  { id: "9001", label: "ISO 9001:2015", sub: "Quality", icon: ShieldCheck },
  { id: "14001", label: "ISO 14001:2015", sub: "Environment", icon: Leaf },
  { id: "45001", label: "ISO 45001:2018", sub: "OH&S", icon: HardHat },
  { id: "27001", label: "ISO 27001:2022", sub: "Information Security", icon: Lock },
  { id: "22000", label: "ISO 22000:2018", sub: "Food Safety", icon: Database },
];

export default function IsoCertificationWorkflow({ onBack }) {
  const navigate = useNavigate();
  const fileInputs = useRef({});
  const [configuration, setConfiguration] = useState(null);
  const [entity, setEntity] = useState({});
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({ isoStandard: "9001", requestType: "New", iecNumber: "", employeeCount: "", scopeText: "" });
  const [documents, setDocuments] = useState([]);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");

  const documentRules = useMemo(() => [
    { id: "qmsManual", label: "Management System Manual" },
    { id: "internalAuditReport", label: "Internal Audit Report" },
    { id: "mrmMinutes", label: "Management Review Meeting Minutes" },
    { id: "legalRegister", label: "Legal and Statutory Register" },
    { id: "riskAssessment", label: "Risk Assessment and Risk Register" },
    { id: "sopConsolidated", label: "Consolidated SOP and Process Records" },
  ], []);

  useEffect(() => {
    let active = true;
    Promise.all([getLicensingConfiguration(SLUG), getLicensingRequests(SLUG), getLicensingLedger(SLUG)])
      .then(async ([configData, requestData, ledgerData]) => {
        const restored = requestData.requests?.find(item => item.status === "DRAFT");
        const nextForm = { isoStandard: "9001", requestType: "New", iecNumber: configData.clientContext?.iecNumber || "", employeeCount: "", scopeText: "", ...(restored?.payload?.form || {}) };
        const nextQuote = await getLicensingQuote(SLUG, nextForm);
        if (!active) return;
        setConfiguration(configData.service);
        setEntity(configData.clientContext || {});
        setDraft(restored || null);
        setForm(nextForm);
        setDocuments(restored?.documents || []);
        setQuote(nextQuote);
        setLedger(ledgerData);
      })
      .catch(error => Swal.fire("Unable to load ISO Certification", errorText(error, "Please try again shortly."), "error"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function updateField(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);
    try { setQuote(await getLicensingQuote(SLUG, next)); } catch { setQuote(null); }
  }
  function validationMessage() {
    const employees = Number(form.employeeCount);
    if (!Number.isInteger(employees) || employees < 1 || employees > 1000000) return "Enter a valid employee count between 1 and 1,000,000.";
    if (form.scopeText.trim().length < 20) return "Describe the certification scope using at least 20 characters.";
    const uploaded = new Set(documents.map(keyOf));
    const missing = documentRules.find(item => !uploaded.has(item.id));
    return missing ? `Upload the required document: ${missing.label}.` : "";
  }
  async function persistDraft(show = true) {
    const response = await saveLicensingDraft(SLUG, { requestId: draft?.id, form });
    setDraft(response.request);
    if (show) await Swal.fire({ icon: "success", title: "ISO audit saved", text: `${response.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" });
    return response.request;
  }
  async function saveDraft() {
    try { setBusy(true); await persistDraft(); } catch (error) { Swal.fire("Unable to save ISO audit", errorText(error, "Please try again."), "error"); } finally { setBusy(false); }
  }
  async function uploadDocument(key, event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    try {
      setUploading(key);
      const request = draft || await persistDraft(false);
      const response = await uploadLicensingDocument(SLUG, request.id, key, file);
      setDocuments(current => [...current.filter(item => keyOf(item) !== key), response.document]);
    } catch (error) { Swal.fire("Upload failed", errorText(error, "The document could not be uploaded."), "error"); } finally { setUploading(""); }
  }
  async function removeDocument(key) {
    if (!draft) return;
    try { setUploading(key); await removeLicensingDocument(SLUG, draft.id, key); setDocuments(current => current.filter(item => keyOf(item) !== key)); }
    catch (error) { Swal.fire("Unable to remove file", errorText(error, "Please try again."), "error"); } finally { setUploading(""); }
  }
  async function downloadDocument(key, name) {
    try { await downloadLicensingDocument(SLUG, draft.id, key, name); } catch (error) { Swal.fire("Unable to download file", errorText(error, "Please try again."), "error"); }
  }
  async function submit() {
    const missing = validationMessage();
    if (missing) return Swal.fire({ icon: "error", title: "ISO audit is incomplete", text: missing, confirmButtonColor: "#2952ff" });
    try {
      setBusy(true);
      const request = await persistDraft(false);
      const response = await submitLicensingRequest(SLUG, { requestId: request.id, form });
      setLedger(await getLicensingLedger(SLUG));
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: response.balances?.walletBalance, creditLine: response.balances?.creditLineBalance } }));
      await Swal.fire({ icon: "success", title: "ISO audit submitted", text: `${response.request.request_code} has been sent for certification review.`, confirmButtonColor: "#2952ff" });
      onBack();
    } catch (error) {
      if (error.response?.status === 402) {
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text: "Your Wallet or Credit Line balance is insufficient.", showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else Swal.fire("Unable to submit ISO audit", errorText(error, "Please verify the form and evidence."), "error");
    } finally { setBusy(false); }
  }

  if (loading || !configuration) return <div className="flex min-h-[520px] items-center justify-center text-slate-500"><LoaderCircle className="mr-2 animate-spin" />Loading ISO Certification…</div>;
  const price = quote || {}, balances = ledger?.balances || {}, valid = !validationMessage();
  return <section className="mx-auto max-w-[1370px] animate-in fade-in duration-300"><div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
    <header className="flex items-start justify-between border-b px-5 py-5 md:px-7"><div className="flex gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-100"><Award /></div><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16} />Back to ISO & Trademark</button><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">ISO Governance Audit</h1><span className="rounded-full bg-slate-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">IAF Accredited</span></div><p className="mt-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{draft?.request_code || "Reference generated on save"} · {entity.companyName || "Company"}{form.iecNumber ? ` · IEC ${form.iecNumber}` : ""}</p></div></div><button onClick={onBack} aria-label="Close workflow"><X className="text-slate-400" /></button></header>
    <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[minmax(0,1.4fr)_360px]"><div className="space-y-6">
      <div><h2 className="mb-3 text-[10px] font-black uppercase tracking-[.2em] text-slate-500">Target ISO standard</h2><div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 md:grid-cols-5">{STANDARDS.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => updateField("isoStandard", item.id)} className={`rounded-xl px-2 py-3 text-center ${form.isoStandard === item.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><Icon className="mx-auto" size={18} /><b className="mt-1 block text-[9px]">{item.label}</b><span className="text-[8px] font-bold uppercase">{item.sub}</span></button>; })}</div></div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">{[["New","Initial Certification","Drafting & audit"],["Surveillance","Annual Surveillance","Maintenance audit"]].map(([id,title,sub]) => <button key={id} onClick={() => updateField("requestType", id)} className={`rounded-xl py-3 ${form.requestType === id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><b className="block text-[10px] uppercase">{title}</b><span className="text-[8px] font-bold uppercase">{sub}</span></button>)}</div>
      <div className="grid gap-4 md:grid-cols-2"><Field label="Total Employee Count" icon={<Users size={13} />}><input type="number" min="1" max="1000000" value={form.employeeCount} onChange={e => updateField("employeeCount", e.target.value)} placeholder="Required for audit man-day calculation" /></Field><div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><span className="text-[9px] font-black uppercase tracking-widest text-blue-500">Audit intensity</span><p className="mt-1 text-lg font-black text-slate-900">{price.auditManDays || "1.5"} man-days</p><p className="text-[10px] text-slate-500">Calculated from the employee count.</p></div><div className="md:col-span-2"><Field label="Certification Scope" icon={<FileCheck size={13} />}><textarea rows="4" maxLength={3000} value={form.scopeText} onChange={e => updateField("scopeText", e.target.value)} placeholder="Describe the sites, products, processes and activities covered by certification…" /></Field><p className={`mt-1 text-right text-[9px] font-bold ${form.scopeText.trim().length >= 20 ? "text-emerald-600" : "text-amber-600"}`}>{form.scopeText.trim().length} / 20 minimum characters</p></div></div>
      <div><h2 className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-800">Required management-system evidence</h2><div className="grid gap-2 lg:grid-cols-2">{documentRules.map(item => { const saved = documents.find(doc => keyOf(doc) === item.id); return <article key={item.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${saved ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>{saved ? <CheckCircle2 size={20} /> : <FileCheck size={20} />}</div><div className="min-w-0 flex-1"><b className="block text-xs">{item.label}<em className="ml-2 text-[8px] not-italic uppercase text-rose-500">Required</em></b><span className={`block truncate text-[10px] ${saved ? "text-emerald-600" : "text-slate-400"}`}>{saved ? nameOf(saved) : "PDF, DOC, XLS, JPG or PNG · max 20 MB"}</span></div>{saved && <><button onClick={() => downloadDocument(item.id, nameOf(saved))} className="p-2 text-[#2952ff]" aria-label={`Download ${item.label}`}><Download size={15} /></button><button onClick={() => removeDocument(item.id)} className="p-2 text-rose-500" aria-label={`Remove ${item.label}`}><Trash2 size={15} /></button></>}<button onClick={() => fileInputs.current[item.id]?.click()} disabled={Boolean(uploading)} className="rounded-lg border px-3 py-2 text-[9px] font-black uppercase disabled:opacity-50"><Upload className="mr-1 inline" size={13} />{uploading === item.id ? "Uploading" : saved ? "Replace" : "Upload"}</button><input ref={node => { fileInputs.current[item.id] = node; }} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={event => uploadDocument(item.id, event)} /></article>; })}</div></div>
    </div><aside className="h-fit overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl xl:sticky xl:top-24"><div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16} /><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger</span></div><div className="space-y-4 p-5"><Ledger label="Certification body fee" value={price.officialFee} /><Ledger label="Documentation & audit" value={price.draftingFee} /><Ledger label="Integrity assurance" value={price.integrityPremium} /><Ledger label="GST (18%)" value={price.gst} /><div className="border-t border-white/10 pt-3 text-xs text-slate-400"><p>Wallet after: <b className="float-right text-white">₹{money(price.closingWalletBalance)}</b></p><p className="mt-2">Credit line after: <b className="float-right text-white">₹{money(price.availableCreditAfter)}</b></p></div><div className="rounded-2xl bg-[#2952ff] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Total certification debit</p><p className="mt-1 text-3xl font-black">₹{money(price.total)}</p></div><p className="text-[10px] text-slate-500">Balances: Wallet ₹{money(balances.walletBalance)} · Credit ₹{money(balances.creditLineBalance)}</p></div></aside></div>
    <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex flex-col gap-3 sm:flex-row"><button onClick={saveDraft} disabled={busy || Boolean(uploading)} className="flex items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold disabled:opacity-50"><Save size={16} />Save Audit</button><button onClick={submit} disabled={busy || Boolean(uploading)} className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black disabled:opacity-50 ${valid ? "bg-[#2952ff] text-white" : "border bg-slate-100 text-slate-500"}`}>{valid ? "Confirm & Submit Audit" : "Incomplete Audit"}<ArrowRight size={16} /></button></div></footer>
  </div></section>;
}

function Field({ label, icon, children }) { return <label className="block"><span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">{icon}{label}<em className="not-italic text-rose-500">*</em></span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ label, value }) { return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><b className="text-rose-400">− ₹{money(value)}</b></div>; }
