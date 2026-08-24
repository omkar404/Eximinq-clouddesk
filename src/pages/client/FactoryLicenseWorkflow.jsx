import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { ArrowLeft, ArrowRight, Building2, Download, Factory, FileClock, FileText, HardHat, Info, Receipt, Save, ShieldCheck, Upload, Users, Wallet, X, Zap } from "lucide-react";
import { downloadFactoryLicenseDocument, getFactoryLicenseConfiguration, getFactoryLicenseLedger, getFactoryLicenseQuote, getFactoryLicenseRequests, removeFactoryLicenseDocument, saveFactoryLicenseDraft, submitFactoryLicense, uploadFactoryLicenseDocument } from "../../services/factoryLicenseService";

const emptyFile = { status: "Not Uploaded", name: null };

export default function FactoryLicenseWorkflow({ onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState({});
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [requestType, setRequestType] = useState("New");
  const [workerCount, setWorkerCount] = useState("");
  const [installedHP, setInstalledHP] = useState("");
  const [factoryAddress, setFactoryAddress] = useState("");
  const [prevLicenseNo, setPrevLicenseNo] = useState("");
  const [files, setFiles] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([getFactoryLicenseConfiguration(), getFactoryLicenseRequests(), getFactoryLicenseLedger()])
      .then(async ([config, data, ledgerData]) => {
        const draft = data.requests?.find((item) => item.status === "DRAFT");
        const payload = draft?.payload || {};
        const type = payload.requestType || "New";
        const pricing = await getFactoryLicenseQuote(type);
        if (!active) return;
        const restored = Object.fromEntries((config.service.documents || []).map((item) => [item.id, { ...emptyFile }]));
        for (const document of draft?.documents || []) restored[document.documentKey] = { status: "Uploaded", name: document.name, size: Number(document.size || 0) };
        setConfiguration(config);
        setQuote(pricing);
        setLedger(ledgerData);
        setRequestId(draft?.id || null);
        setDraftCode(draft?.request_code || "");
        setRequestType(type);
        setWorkerCount(payload.workerCount ?? "");
        setInstalledHP(payload.installedHP ?? "");
        setFactoryAddress(payload.factoryAddress || "");
        setPrevLicenseNo(payload.prevLicenseNo || "");
        setFiles(restored);
      })
      .catch(() => active && setError("Unable to load Factory License."))
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing) return undefined;
    const timer = setTimeout(() => {
      getFactoryLicenseQuote(requestType)
        .then((data) => { setQuote(data); setError(""); })
        .catch(() => setError("Unable to calculate Factory License fees."));
    }, 250);
    return () => clearTimeout(timer);
  }, [requestType, initializing]);

  const config = configuration?.service;
  const documents = useMemo(() => (config?.documents || []).filter((item) => !item.requestTypes || item.requestTypes.includes(requestType)), [config, requestType]);
  const payload = () => ({ requestId, requestType, workerCount: workerCount === "" ? "" : Number(workerCount), installedHP: installedHP === "" ? "" : Number(installedHP), factoryAddress, prevLicenseNo, documents: files });
  const valid = Boolean(Number.isInteger(Number(workerCount)) && Number(workerCount) > 0 && Number(installedHP) > 0 && factoryAddress.trim() && (requestType !== "Renewal" || prevLicenseNo.trim()) && documents.filter((item) => item.required).every((item) => files[item.id]?.status === "Uploaded"));

  async function ensureDraft() {
    if (requestId) return requestId;
    const data = await saveFactoryLicenseDraft(payload());
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
      const data = await uploadFactoryLicenseDocument(id, key, file);
      setFiles((current) => ({ ...current, [key]: { status: "Uploaded", name: data.document.name, size: data.document.size } }));
    } catch (uploadError) {
      Swal.fire("Upload failed", uploadError.response?.data?.message || "The document could not be uploaded.", "error");
    } finally { setUploading(""); }
  }

  async function removeFile(key) {
    try {
      setUploading(key);
      await removeFactoryLicenseDocument(requestId, key);
      setFiles((current) => ({ ...current, [key]: { ...emptyFile } }));
    } catch (removeError) {
      Swal.fire("Unable to remove document", removeError.response?.data?.message || "Please try again.", "error");
    } finally { setUploading(""); }
  }

  async function downloadFile(key) {
    try { await downloadFactoryLicenseDocument(requestId, key, files[key]?.name); }
    catch (downloadError) { Swal.fire("Download failed", downloadError.response?.data?.message || "The document could not be downloaded.", "error"); }
  }

  async function saveDraft() {
    try {
      setBusy(true);
      const data = await saveFactoryLicenseDraft(payload());
      setRequestId(data.request.id);
      setDraftCode(data.request.request_code);
      await Swal.fire({ icon: "success", title: "Factory License draft saved", text: `${data.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" });
    } catch (saveError) {
      Swal.fire("Unable to save draft", saveError.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  }

  async function submit() {
    if (!valid) return;
    try {
      setBusy(true);
      const data = await submitFactoryLicense(payload());
      const [pricing, nextLedger] = await Promise.all([getFactoryLicenseQuote(requestType), getFactoryLicenseLedger()]);
      setQuote(pricing);
      setLedger(nextLedger);
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: { balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance } }));
      await Swal.fire({ icon: "success", title: "Factory License request submitted", text: `${data.request.request_code} has been sent to the Admin Request Board.`, confirmButtonColor: "#2952ff" });
      onBack();
    } catch (submitError) {
      if (submitError.response?.status === 402) {
        const code = submitError.response?.data?.errors?.code;
        const message = code === "INSUFFICIENT_WALLET" ? "Wallet balance is insufficient. Please top up your Wallet." : code === "INSUFFICIENT_CREDIT_LINE" ? "Credit Line balance is insufficient. Please top up your Credit Line." : "Wallet and Credit Line balances are insufficient. Please top up both.";
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text: message, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else Swal.fire("Unable to submit request", submitError.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  }

  if (initializing) return <div className="mx-auto max-w-7xl p-6"><div className="min-h-[700px] animate-pulse rounded-[30px] bg-white shadow-lg" /></div>;

  return <div className="min-h-[calc(100vh-7rem)]"><div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
    {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
    {draftCode && <div className="mb-3 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900"><Save size={17}/><div><b className="text-xs">Draft {draftCode} restored</b><p className="text-[11px] text-blue-600">Continue your Factory License application.</p></div></div>}
    <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
      <header className="flex justify-between border-b p-5"><div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white"><Factory/></div><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16}/> Back to Compliance</button><div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">Factory License Management</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">Statutory</span></div><p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{draftCode||"New Factory Licence Audit"}<ShieldCheck size={11} className="text-amber-500"/> SLA Priority</p></div></div><button onClick={onBack}><X className="text-slate-400"/></button></header>
      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]"><div className="space-y-5">
        <div className="grid gap-2 rounded-2xl bg-slate-100 p-1 md:grid-cols-2">{(config?.requestTypes || []).map((type) => <button key={type.id} onClick={() => setRequestType(type.id)} className={`rounded-xl px-3 py-3 ${requestType === type.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><b className="block text-xs uppercase">{type.label}</b><span className="text-[9px] uppercase">{type.description}</span></button>)}</div>
        <div className="grid gap-4 md:grid-cols-2"><Field label="Max Workers (Peak)" icon={<Users size={12}/>}><input type="number" min="1" step="1" value={workerCount} onChange={(event) => setWorkerCount(event.target.value)} placeholder="Total Employees"/></Field><Field label="Installed Power (HP)" icon={<Zap size={12}/>}><input type="number" min="0.01" step="0.01" value={installedHP} onChange={(event) => setInstalledHP(event.target.value)} placeholder="Total Machinery HP"/></Field><Field label="Factory Plot Address" icon={<Building2 size={12}/>}><input value={factoryAddress} onChange={(event) => setFactoryAddress(event.target.value)} placeholder="As per Industrial lease"/></Field>{requestType === "Renewal" && <Field label="Existing License No." icon={<FileClock size={12}/>}><input value={prevLicenseNo} onChange={(event) => setPrevLicenseNo(event.target.value.toUpperCase())} placeholder="e.g. 12345/MUM/2024"/></Field>}<div><span className="mb-1.5 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><HardHat size={12}/>Safety Readiness</span><div className="flex items-center justify-between rounded-xl bg-slate-50 p-3.5 text-sm font-black text-slate-400"><span>DISH Compliant Inspection</span><ShieldCheck size={14}/></div></div></div>
        <div><h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14}/> Required Audit Evidence</h2><div className="space-y-2">{documents.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className={files[document.id]?.status === "Uploaded" ? "text-emerald-500" : "text-slate-400"}/><div className="min-w-0 flex-1"><b className="block text-xs uppercase">{document.label}{document.required && <em className="ml-2 not-italic text-[9px] text-rose-500">REQUIRED</em>}</b><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "Awaiting PDF audit evidence"}</span></div>{files[document.id]?.status === "Uploaded" && <button onClick={() => downloadFile(document.id)} title="Download uploaded document" className="text-[#2952ff]"><Download size={16}/></button>}{files[document.id]?.status === "Uploaded" && <button onClick={() => removeFile(document.id)} className="text-[10px] font-black uppercase text-rose-500">Remove</button>}<label className="cursor-pointer rounded-lg border bg-slate-50 px-4 py-2 text-[10px] font-black uppercase">{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input className="sr-only" type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(event) => selectFile(document.id, event)}/></label></article>)}</div></div>
        <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900"><Info size={16}/><p className="text-[10px] font-medium uppercase leading-relaxed"><strong>Occupier Warning:</strong> False declaration of workers or power load results in criminal liability for the factory owner. Renewal audits must reconcile with current electricity bills and PF records.</p></div>
      </div><aside className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl xl:sticky xl:top-24 xl:self-start"><div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400"><Receipt size={16}/><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div><div className="space-y-5 p-5"><Ledger title="Prepaid Wallet" balance={quote.openingWalletBalance} lines={[["Official Govt Portal Fee", quote.officialFee]]} after={quote.closingWalletBalance}/><Ledger title="Corporate Credit Line" balance={quote.currentCreditLimit} lines={[["Technical Drafting & Site Audit", quote.draftingFee], ["Zero-Deficiency Premium", quote.successPremium], ["GST (18%)", quote.gst]]} after={quote.availableCreditAfter}/></div><div className="flex justify-between bg-[#2952ff] p-5"><div><span className="text-[9px] font-black uppercase text-blue-100">Total Audit Debit</span><b className="block text-2xl">₹{Number(quote.total || 0).toLocaleString("en-IN")}</b></div><span className="text-right text-[9px] uppercase text-white/70">SLA: {config?.sla}<br/>{ledger.transactions.length} ledger entries</span></div></aside></div>
      <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex gap-3"><button onClick={saveDraft} disabled={busy} className="flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"><Save size={16}/> Save Draft</button><button onClick={submit} disabled={busy || !valid} className={`flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-400"}`}>{valid ? "Confirm & File Audit" : "Incomplete Audit"}<ArrowRight size={16}/></button></div></footer>
    </div>
  </div></div>;
}

function Field({ label, icon, children }) { return <label className="space-y-1.5"><span className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{icon}{label}</span><span className="iem-field-control block">{children}</span></label>; }
function Ledger({ title, balance, lines, after }) { return <div><div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14}/></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><b>₹{Number(balance || 0).toLocaleString("en-IN")}</b></div>{lines.map(([label, amount]) => <div key={label} className="flex justify-between border-t border-white/10 pt-2"><span className="text-slate-400">{label}</span><b className="text-rose-400">- ₹{Number(amount || 0).toLocaleString("en-IN")}</b></div>)}<div className="flex justify-between border-t border-white/10 pt-2"><span className="text-blue-400">Available Post-Task</span><b>₹{Number(after || 0).toLocaleString("en-IN")}</b></div></div></div>; }
