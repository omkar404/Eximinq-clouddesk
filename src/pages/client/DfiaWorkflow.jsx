import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft, ArrowRight, Building2, CheckCircle2, Download, FileCheck,
  FileText, Fingerprint, Info, Layers, Link, LoaderCircle, Receipt,
  RefreshCw, Save, Trash2, Upload, Wallet, X, Zap,
} from "lucide-react";
import {
  downloadLicensingDocument, getLicensingConfiguration, getLicensingLedger,
  getLicensingQuote, getLicensingRequests, removeLicensingDocument,
  saveLicensingDraft, submitLicensingRequest, uploadLicensingDocument,
} from "../../services/licensingService";

const SLUG = "dfia-license";
const RA_OFFICES = ["RA Ahmedabad", "RA Bengaluru", "RA Chennai", "RA Delhi", "RA Hyderabad", "RA Kolkata", "RA Mumbai", "RA Pune"];
const money = (value) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0));
const errorText = (error, fallback) => error?.response?.data?.message || error?.message || fallback;
const documentKey = (item) => item?.document_key || item?.documentKey || "";
const documentName = (item) => item?.original_name || item?.name || "Uploaded document";

export default function DfiaWorkflow({ onBack }) {
  const navigate = useNavigate();
  const fileInputs = useRef({});
  const [configuration, setConfiguration] = useState(null);
  const [entity, setEntity] = useState({});
  const [draft, setDraft] = useState(null);
  const [form, setForm] = useState({ dfiaType: "issuance", iecNumber: "", sionNo: "", raOffice: "", dutyValue: "" });
  const [documents, setDocuments] = useState([]);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getLicensingConfiguration(SLUG),
      getLicensingRequests(SLUG),
      getLicensingLedger(SLUG),
    ]).then(async ([configData, requestData, ledgerData]) => {
      const restored = requestData.requests?.find((item) => item.status === "DRAFT");
      const nextForm = {
        dfiaType: "issuance",
        iecNumber: configData.clientContext?.iecNumber || "",
        sionNo: "",
        raOffice: "",
        dutyValue: "",
        ...(restored?.payload?.form || {}),
      };
      const nextQuote = await getLicensingQuote(SLUG, nextForm);
      if (!active) return;
      setConfiguration(configData.service);
      setEntity(configData.clientContext || {});
      setDraft(restored || null);
      setForm(nextForm);
      setDocuments(restored?.documents || []);
      setQuote(nextQuote);
      setLedger(ledgerData);
    }).catch((error) => Swal.fire("Unable to load DFIA", errorText(error, "Please try again shortly."), "error"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const activeDocuments = useMemo(() => (configuration?.documents || []).filter((item) =>
    !item.visibleWhen || String(form[item.visibleWhen.field]) === String(item.visibleWhen.equals)
  ), [configuration?.documents, form]);

  async function updateField(field, value) {
    const next = { ...form, [field]: value };
    if (field === "dfiaType" && value === "transferability") next.dutyValue = "";
    setForm(next);
    try { setQuote(await getLicensingQuote(SLUG, next)); } catch { setQuote(null); }
  }

  function validationMessage() {
    if (!form.raOffice?.trim()) return "Select the DGFT Regional Authority office.";
    if (!form.sionNo?.trim()) return "Enter the SION serial number or norms reference.";
    if (form.dfiaType === "issuance" && Number(form.dutyValue) <= 0) return "Enter a valid estimated entitlement value.";
    const uploaded = new Set(documents.map(documentKey));
    const missing = activeDocuments.find((item) => item.required && !uploaded.has(item.id));
    return missing ? `Upload the required document: ${missing.label}.` : "";
  }

  async function persistDraft({ showMessage = true } = {}) {
    const response = await saveLicensingDraft(SLUG, { requestId: draft?.id, form });
    setDraft(response.request);
    if (showMessage) await Swal.fire({ icon: "success", title: "DFIA draft saved", text: `${response.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" });
    return response.request;
  }

  async function saveDraft() {
    try { setBusy(true); await persistDraft(); }
    catch (error) { Swal.fire("Unable to save DFIA draft", errorText(error, "Please try again."), "error"); }
    finally { setBusy(false); }
  }

  async function uploadDocument(key, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setUploading(key);
      const request = draft || await persistDraft({ showMessage: false });
      const response = await uploadLicensingDocument(SLUG, request.id, key, file);
      setDocuments((current) => [...current.filter((item) => documentKey(item) !== key), response.document]);
    } catch (error) {
      Swal.fire("Upload failed", errorText(error, "The document could not be uploaded."), "error");
    } finally { setUploading(""); }
  }

  async function removeDocument(key) {
    if (!draft) return;
    try {
      setUploading(key);
      await removeLicensingDocument(SLUG, draft.id, key);
      setDocuments((current) => current.filter((item) => documentKey(item) !== key));
    } catch (error) { Swal.fire("Unable to remove file", errorText(error, "Please try again."), "error"); }
    finally { setUploading(""); }
  }

  async function downloadDocument(key, name) {
    try { await downloadLicensingDocument(SLUG, draft.id, key, name); }
    catch (error) { Swal.fire("Unable to download file", errorText(error, "Please try again."), "error"); }
  }

  async function submit() {
    const missing = validationMessage();
    if (missing) return Swal.fire({ icon: "error", title: "DFIA application is incomplete", text: missing, confirmButtonColor: "#2952ff" });
    try {
      setBusy(true);
      const request = await persistDraft({ showMessage: false });
      const response = await submitLicensingRequest(SLUG, { requestId: request.id, form });
      setLedger(await getLicensingLedger(SLUG));
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: response.balances?.walletBalance, creditLine: response.balances?.creditLineBalance } }));
      await Swal.fire({ icon: "success", title: "DFIA application submitted", text: `${response.request.request_code} has been sent to the admin team.`, confirmButtonColor: "#2952ff" });
      onBack();
    } catch (error) {
      if (error.response?.status === 402) {
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text: "Your Wallet or Credit Line balance is insufficient for this DFIA request.", showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else Swal.fire("Unable to submit DFIA", errorText(error, "Please verify the application and try again."), "error");
    } finally { setBusy(false); }
  }

  if (loading || !configuration) return <div className="flex min-h-[520px] items-center justify-center text-slate-500"><LoaderCircle className="mr-2 animate-spin"/> Loading DFIA workflow…</div>;
  const valid = !validationMessage();
  const price = quote || {};
  const balances = ledger?.balances || {};

  return <section className="mx-auto max-w-[1370px] animate-in fade-in duration-300">
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
      <header className="flex items-start justify-between border-b px-5 py-5 md:px-7"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-100"><Layers/></div><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Back to Licensing</button><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black">DFIA Authorisation</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">Licensing</span></div><p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><Fingerprint size={11} className="text-[#2952ff]"/>{draft?.request_code || "Reference generated on save"}<Zap size={11} className="text-amber-500"/> Priority SLA</p></div></div><button onClick={onBack} aria-label="Close DFIA workflow"><X className="text-slate-400"/></button></header>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-blue-50/70 px-5 py-3 text-[10px] font-black uppercase tracking-[.14em] text-blue-700"><span className="flex items-center gap-2"><RefreshCw size={12}/> Exporter profile: {entity.companyName || "Company profile"}{form.iecNumber ? ` · IEC ${form.iecNumber}` : ""}</span><span>Post-export mode</span></div>
      <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.4fr)_360px] md:p-7"><div className="space-y-6">
        <div className="grid grid-cols-2 gap-2 rounded-2xl border bg-slate-100 p-1">{[{id:"issuance",label:"Licence Issuance",Icon:FileCheck},{id:"transferability",label:"Transferability",Icon:Link}].map((item)=><button key={item.id} onClick={()=>updateField("dfiaType",item.id)} className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-black uppercase ${form.dfiaType===item.id?"border border-blue-200 bg-white text-[#2952ff] shadow-sm":"text-slate-400"}`}><item.Icon size={16}/>{item.label}</button>)}</div>
        <div className="grid gap-4 md:grid-cols-2"><Field label="DGFT RA Office" required><div className="relative"><select value={form.raOffice} onChange={(e)=>updateField("raOffice",e.target.value)}><option value="">Select Regional Authority</option>{RA_OFFICES.map((office)=><option key={office}>{office}</option>)}</select><Building2 className="pointer-events-none absolute right-4 top-3.5 text-slate-400" size={16}/></div></Field><Field label="SION Serial Number" required><input maxLength={100} value={form.sionNo} onChange={(e)=>updateField("sionNo",e.target.value.toUpperCase())} placeholder="E.g. C-123 (Chemicals)"/></Field>{form.dfiaType==="issuance"&&<Field label="Estimated Entitlement Value (INR)" required className="md:col-span-2"><input type="number" min="1" step="0.01" value={form.dutyValue} onChange={(e)=>updateField("dutyValue",e.target.value)} placeholder="Enter total duty value to be issued"/><p className="mt-2 text-[10px] font-medium italic text-blue-600">Success fee: 1% of the transferable duty credit issued post-export.</p></Field>}</div>
        <div><h2 className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-800">Export audit requirements</h2><div className="space-y-2">{activeDocuments.map((item)=>{const saved=documents.find((document)=>documentKey(document)===item.id);return <article key={item.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${saved?"bg-emerald-50 text-emerald-600":"bg-slate-50 text-slate-400"}`}>{saved?<CheckCircle2 size={20}/>:<FileText size={20}/>}</div><div className="min-w-0 flex-1"><b className="block text-xs">{item.label}<em className="ml-2 not-italic text-[9px] uppercase text-rose-500">Required</em></b><span className={`block truncate text-[10px] ${saved?"text-emerald-600":"text-slate-400"}`}>{saved?documentName(saved):"PDF, DOC, XLS, JPG or PNG · maximum 20 MB"}</span></div>{saved&&<><button onClick={()=>downloadDocument(item.id,documentName(saved))} aria-label={`Download ${item.label}`} className="rounded-lg p-2 text-[#2952ff] hover:bg-blue-50"><Download size={16}/></button><button onClick={()=>removeDocument(item.id)} aria-label={`Remove ${item.label}`} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"><Trash2 size={16}/></button></>}<button onClick={()=>fileInputs.current[item.id]?.click()} disabled={Boolean(uploading)} className="rounded-lg border bg-white px-4 py-2 text-[10px] font-black uppercase disabled:opacity-50"><Upload className="mr-1 inline" size={14}/>{uploading===item.id?"Uploading":saved?"Replace":"Upload"}</button><input ref={(node)=>{fileInputs.current[item.id]=node;}} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event)=>uploadDocument(item.id,event)}/></article>})}</div></div>
        <div className="flex gap-3 rounded-xl border bg-slate-50 p-4 text-[11px] text-slate-600"><Info className="shrink-0 text-[#2952ff]" size={16}/><p><b>Statutory note:</b> IEC and GST credentials are synchronized from the Company Profile. Ensure every Shipping Bill is correctly linked to the IEC in DGFT records.</p></div>
      </div><aside className="h-fit overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl xl:sticky xl:top-24"><div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16}/><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div><div className="space-y-4 p-5"><Ledger label="DGFT official fee — Wallet" value={price.officialFee}/><Ledger label="Drafting & audit submission" value={price.draftingFee}/>{form.dfiaType==="issuance"&&<Ledger label="Success fee (1%)" value={price.successFee}/>}<Ledger label="GST (18%)" value={price.gst}/><div className="border-t border-white/10 pt-3 text-xs text-slate-400"><p>Wallet after: <b className="float-right text-white">₹{money(price.closingWalletBalance)}</b></p><p className="mt-2">Credit line after: <b className="float-right text-white">₹{money(price.availableCreditAfter)}</b></p></div><div className="rounded-2xl bg-[#2952ff] p-4"><p className="text-[9px] font-black uppercase tracking-widest text-blue-100">Final application value</p><p className="mt-1 text-3xl font-black">₹{money(price.total)}</p></div><p className="text-[10px] text-slate-500">Current balances: Wallet ₹{money(balances.walletBalance)} · Credit ₹{money(balances.creditLineBalance)}</p></div></aside></div>
      <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex flex-col gap-3 sm:flex-row"><button onClick={saveDraft} disabled={busy||Boolean(uploading)} className="flex items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold disabled:opacity-50"><Save size={16}/> Save Draft</button><button onClick={submit} disabled={busy||Boolean(uploading)} className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black disabled:opacity-50 ${valid?"bg-[#2952ff] text-white":"border bg-slate-100 text-slate-500"}`}>{valid?"Process Payment & Submit":"Review Requirements"}<ArrowRight size={16}/></button></div></footer>
    </div>
  </section>;
}

function Field({ label, required = false, className = "", children }) { return <label className={`block ${className}`}><span className="mb-2 block text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{label}{required&&<em className="ml-1 not-italic text-rose-500">*</em>}</span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ label, value }) { return <div className="flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><b className="text-rose-400">− ₹{money(value)}</b></div>; }
