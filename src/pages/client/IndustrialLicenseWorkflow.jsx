import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  AlertTriangle, ArrowLeft, ArrowRight, FileText, Gavel, MapPin,
  Microscope, Receipt, Save, Scale, Upload, Wallet, X, Zap
} from "lucide-react";
import {
  getIndustrialLicenseConfiguration, getIndustrialLicenseLedger,
  getIndustrialLicenseQuote, getIndustrialLicenseRequests,
  removeIndustrialLicenseDocument, saveIndustrialLicenseDraft,
  submitIndustrialLicense, uploadIndustrialLicenseDocument
} from "../../services/industrialLicenseService";

const emptyFiles = {
  technicalProcess: { status: "Not Uploaded", name: null },
  landDocs: { status: "Not Uploaded", name: null },
  moaAoa: { status: "Not Uploaded", name: null },
  projectReport: { status: "Not Uploaded", name: null },
  mouTech: { status: "Not Uploaded", name: null },
  envClearance: { status: "Not Uploaded", name: null }
};

export default function IndustrialLicenseWorkflow({ service, onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [requestType, setRequestType] = useState("new");
  const [nicCode, setNicCode] = useState("");
  const [investmentPM, setInvestmentPM] = useState("");
  const [locationType, setLocationType] = useState("standard");
  const [files, setFiles] = useState(emptyFiles);
  const [initializing, setInitializing] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const skipNextQuote = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      getIndustrialLicenseConfiguration(),
      getIndustrialLicenseRequests(),
      getIndustrialLicenseLedger()
    ]).then(async ([config, requests, ledgerData]) => {
      if (!active) return;
      const draft = requests.requests?.find((item) => item.status === "DRAFT");
      const draftPayload = draft?.payload || {};
      const initialType = draftPayload.requestType || "new";
      const quoteData = await getIndustrialLicenseQuote(initialType);
      if (!active) return;
      const restoredFiles = { ...emptyFiles };
      for (const document of draft?.documents || []) {
        restoredFiles[document.documentKey] = {
          status: "Uploaded", name: document.name, size: Number(document.size || 0)
        };
      }
      setConfiguration(config);
      setLedger(ledgerData);
      setQuote(quoteData);
      skipNextQuote.current = true;
      setRequestType(initialType);
      setRequestId(draft?.id || null);
      setDraftCode(draft?.request_code || "");
      setNicCode(draftPayload.nicCode || "");
      setInvestmentPM(draftPayload.investmentPM || "");
      setLocationType(draftPayload.locationType || "standard");
      setFiles(restoredFiles);
    }).catch(() => active && setError("Unable to load Industrial Licence configuration."))
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing) return undefined;
    if (skipNextQuote.current) {
      skipNextQuote.current = false;
      return undefined;
    }
    let active = true;
    setQuoteLoading(true);
    getIndustrialLicenseQuote(requestType)
      .then((data) => active && setQuote(data))
      .catch(() => active && setError("Unable to calculate Industrial Licence pricing."))
      .finally(() => active && setQuoteLoading(false));
    return () => { active = false; };
  }, [requestType, initializing]);

  const serviceConfig = configuration?.service;
  const documents = useMemo(() => serviceConfig?.documents || [], [serviceConfig]);
  const payload = () => ({ requestId, requestType, nicCode, investmentPM, locationType, documents: files });
  const valid = /^\d{5}$/.test(nicCode) && Number(investmentPM) > 0 &&
    documents.filter((item) => item.required).every((item) => files[item.id]?.status === "Uploaded");

  const ensureDraft = async () => {
    if (requestId) return requestId;
    const data = await saveIndustrialLicenseDraft(payload());
    setRequestId(data.request.id);
    setDraftCode(data.request.request_code);
    return data.request.id;
  };

  const selectFile = async (documentKey, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setUploading(documentKey);
      const id = await ensureDraft();
      const data = await uploadIndustrialLicenseDocument(id, documentKey, file);
      setFiles((current) => ({ ...current, [documentKey]: {
        status: "Uploaded", name: data.document.name, size: data.document.size
      } }));
    } catch (requestError) {
      Swal.fire("Upload failed", requestError.response?.data?.message || "The document could not be uploaded.", "error");
    } finally { setUploading(""); }
  };

  const removeFile = async (documentKey) => {
    if (!requestId) return;
    try {
      setUploading(documentKey);
      await removeIndustrialLicenseDocument(requestId, documentKey);
      setFiles((current) => ({ ...current, [documentKey]: { status: "Not Uploaded", name: null } }));
    } catch (requestError) {
      Swal.fire("Unable to remove document", requestError.response?.data?.message || "Please try again.", "error");
    } finally { setUploading(""); }
  };

  const saveDraft = async () => {
    try {
      setBusy(true);
      const data = await saveIndustrialLicenseDraft(payload());
      setRequestId(data.request.id);
      setDraftCode(data.request.request_code);
      await Swal.fire({ icon: "success", title: "Audit progress saved", text: `${data.request.request_code} can be resumed later.`, confirmButtonColor: "#2952ff" });
    } catch (requestError) {
      Swal.fire("Unable to save draft", requestError.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!valid) return;
    try {
      setBusy(true);
      const data = await submitIndustrialLicense(payload());
      setDraftCode("");
      const [nextQuote, nextLedger] = await Promise.all([
        getIndustrialLicenseQuote(requestType), getIndustrialLicenseLedger()
      ]);
      setQuote(nextQuote);
      setLedger(nextLedger);
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: {
        balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance
      } }));
      await Swal.fire({ icon: "success", title: "Industrial Licence submitted", text: `${data.request.request_code} has been sent to the admin team.`, confirmButtonColor: "#2952ff" });
      onBack();
    } catch (requestError) {
      const code = requestError.response?.data?.errors?.code;
      if (requestError.response?.status === 402) {
        const message = code === "INSUFFICIENT_WALLET"
          ? "Wallet balance is insufficient. Please top up your Wallet."
          : code === "INSUFFICIENT_CREDIT_LINE"
            ? "Credit Line balance is insufficient. Please top up your Credit Line."
            : "Wallet and Credit Line balances are insufficient. Please top up both.";
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text: message, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else {
        Swal.fire("Unable to submit Industrial Licence", requestError.response?.data?.message || "Please try again.", "error");
      }
    } finally { setBusy(false); }
  };

  if (initializing) return <IndustrialLicenseLoading onBack={onBack} />;
  const costs = quote || {};
  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
        {draftCode && <div className="mb-3 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900"><Save size={17} /><div><p className="text-xs font-bold">Draft {draftCode} restored</p><p className="text-[11px] text-blue-600">Continue your Industrial Licence audit.</p></div></div>}
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
          <header className="flex justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-100"><Gavel /></div>
              <div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#2952ff]"><ArrowLeft size={16} /> Back to Compliance</button>
                <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">{serviceConfig?.name || service.title}</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">{serviceConfig?.transactionType}</span></div>
                <p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{serviceConfig?.standard}<Zap size={11} className="text-amber-500" /> Government Clearance</p>
              </div></div>
            <button onClick={onBack} className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100"><X className="mx-auto" size={20} /></button>
          </header>
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {(serviceConfig?.requestTypes || []).map((type) => <button key={type.id} onClick={() => setRequestType(type.id)} className={`rounded-xl px-3 py-3 text-center transition ${requestType === type.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><strong className="block text-xs uppercase">{type.label}</strong><span className="text-[9px] uppercase">{type.description}</span></button>)}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field icon={<Microscope />} label="NIC Code (5-Digit)"><input maxLength="5" value={nicCode} onChange={(event) => setNicCode(event.target.value.replace(/\D/g, ""))} placeholder="E.g. 24111" /></Field>
                <Field icon={<Scale />} label="Investment in P&M (INR Cr)"><input type="number" min="0" value={investmentPM} onChange={(event) => setInvestmentPM(event.target.value)} placeholder="Total machinery value" /></Field>
                <div className="md:col-span-2"><Field icon={<MapPin />} label="Factory Location Type"><select value={locationType} onChange={(event) => setLocationType(event.target.value)}>{(serviceConfig?.locationTypes || []).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></Field></div>
              </div>
              {locationType === "restricted" && <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800"><AlertTriangle size={18} /><p className="text-[10px] font-semibold uppercase leading-5"><strong>Statutory warning:</strong> Industrial licensing may be mandatory within 25 km of a city with one million or more population unless the unit is in a designated industrial area.</p></div>}
              <div><h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14} /> Required Statutory Evidence</h2>
                <div className="space-y-2">{documents.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className={files[document.id]?.status === "Uploaded" ? "text-emerald-500" : "text-slate-400"} /><div className="min-w-0 flex-1"><strong className="block text-xs uppercase">{document.label} {document.required && <em className="ml-1 not-italic text-[9px] text-rose-500">REQUIRED</em>}</strong><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "Awaiting PDF audit evidence"}</span></div>
                  {files[document.id]?.status === "Uploaded" && <button onClick={() => removeFile(document.id)} className="text-[10px] font-black uppercase text-rose-500">Remove</button>}
                  <label className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase">{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => selectFile(document.id, event)} /></label>
                </article>)}</div>
              </div>
            </div>
            <aside className={`overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl transition-opacity xl:sticky xl:top-24 xl:self-start ${quoteLoading ? "opacity-80" : "opacity-100"}`}>
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-blue-400"><Receipt size={16} /><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div>
              <div className="space-y-5 p-5">
                <Ledger title="Prepaid Wallet" balance={costs.openingWalletBalance} lines={[["DPIIT Statutory Filing Fee", costs.officialFee]]} after={costs.closingWalletBalance} />
                <Ledger title="Corporate Credit Line" balance={costs.currentCreditLimit} lines={[["Technical Drafting & Case Prep", costs.draftingFee], ["Clearance Premium", costs.successPremium], ["GST", costs.gst]]} after={costs.availableCreditAfter} />
              </div>
              <div className="flex items-center justify-between bg-[#2952ff] px-5 py-4"><div><span className="text-[9px] font-black uppercase tracking-widest text-blue-100">Total Audit Debit</span><strong className="block text-2xl">₹{Number(costs.total || 0).toLocaleString("en-IN")}</strong></div><span className="text-right text-[9px] uppercase text-white/70">SLA: {serviceConfig?.sla}<br />{ledger.transactions.length} ledger entries</span></div>
            </aside>
          </div>
          <footer className="flex flex-col items-stretch justify-between gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex gap-3"><button onClick={saveDraft} disabled={busy || !serviceConfig} className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"><Save size={16} /> Save Draft</button><button onClick={submit} disabled={busy || !valid} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-[#2952ff] text-white shadow-lg shadow-blue-100" : "bg-slate-200 text-slate-400"}`}>{valid ? "Confirm & File Audit" : "Incomplete Audit"} <ArrowRight size={16} /></button></div></footer>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }) {
  return <label className="space-y-1.5"><span className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{icon}{label}</span><span className="iem-field-control block">{children}</span></label>;
}
function Ledger({ title, balance, lines, after }) {
  return <div><div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14} /></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><strong>₹{Number(balance || 0).toLocaleString("en-IN")}</strong></div>{lines.map(([label, amount]) => <div key={label} className="flex justify-between border-t border-white/10 pt-2"><span className="text-slate-400">{label}</span><strong className="text-rose-400">- ₹{Number(amount || 0).toLocaleString("en-IN")}</strong></div>)}<div className="flex justify-between border-t border-white/10 pt-2"><span className="text-blue-400">Available Post-Task</span><strong>₹{Number(after || 0).toLocaleString("en-IN")}</strong></div></div></div>;
}
function IndustrialLicenseLoading({ onBack }) {
  return <div className="min-h-[calc(100vh-7rem)]"><div className="mx-auto max-w-7xl px-4 py-4 lg:px-6"><div className="min-h-[720px] rounded-[30px] border bg-white p-5 shadow-lg"><div className="flex justify-between border-b pb-4"><div className="flex items-center gap-4"><div className="h-12 w-12 animate-pulse rounded-2xl bg-blue-100" /><div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft size={16} /> Back to Compliance</button><div className="mt-2 h-5 w-56 animate-pulse rounded bg-slate-200" /></div></div><X className="text-slate-300" /></div><div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]"><div className="space-y-4"><div className="h-20 animate-pulse rounded-2xl bg-slate-100" />{[1,2,3,4,5].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div><div className="h-[500px] animate-pulse rounded-3xl bg-slate-900" /></div></div></div></div>;
}
