import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, Download, FileText, Info, Receipt,
  Save, ShieldCheck, Trash2, Upload, Users, Wallet, X, Zap
} from "lucide-react";
import {
  downloadIemDocument, getIemConfiguration, getIemLedger, getIemQuote, getIemRequests,
  removeIemDocument, saveIemDraft, submitIem, uploadIemDocument
} from "../../services/iemRegistrationService";

const emptyFiles = {
  technicalNote: { status: "Not Uploaded", name: null },
  moaAoa: { status: "Not Uploaded", name: null },
  landDeed: { status: "Not Uploaded", name: null },
  partAAck: { status: "Not Uploaded", name: null },
  investmentProof: { status: "Not Uploaded", name: null },
  panCard: { status: "Not Uploaded", name: null }
};

export default function IemRegistrationWorkflow({ onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [filingPart, setFilingPart] = useState("intent");
  const [nicCode, setNicCode] = useState("");
  const [investment, setInvestment] = useState("");
  const [employment, setEmployment] = useState("");
  const [files, setFiles] = useState(emptyFiles);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");
  const [initializing, setInitializing] = useState(true);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const skipNextQuoteLoad = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([getIemConfiguration(), getIemRequests(), getIemLedger()])
      .then(async ([config, requests, ledgerData]) => {
        if (!active) return;
        const draft = requests.requests?.find((item) => item.status === "DRAFT");
        const draftPayload = draft?.payload || {};
        const initialPart = draftPayload.filingPart || "intent";
        const quoteData = await getIemQuote(initialPart);
        if (!active) return;

        const restoredFiles = { ...emptyFiles };
        if (draft) {
          for (const document of draft.documents || []) {
            const documentKey = document.documentKey;
            if (!restoredFiles[documentKey]) continue;
            restoredFiles[documentKey] = {
              status: "Uploaded",
              name: document.name,
              size: Number(document.size || 0)
            };
          }
        }

        setConfiguration(config);
        setLedger(ledgerData);
        setQuote(quoteData);
        skipNextQuoteLoad.current = true;
        setFilingPart(initialPart);
        setRequestId(draft?.id || null);
        setDraftCode(draft?.request_code || "");
        setNicCode(draftPayload.nicCode || "");
        setInvestment(draftPayload.investment || "");
        setEmployment(draftPayload.expectedEmployment || "");
        setFiles(restoredFiles);
      })
      .catch(() => active && setError("Unable to load IEM Registration configuration."))
      .finally(() => active && setInitializing(false));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (initializing) return undefined;
    if (skipNextQuoteLoad.current) {
      skipNextQuoteLoad.current = false;
      return undefined;
    }
    let active = true;
    setQuoteLoading(true);
    getIemQuote(filingPart)
      .then((data) => active && setQuote(data))
      .catch(() => active && setError("Unable to calculate IEM filing fees."))
      .finally(() => active && setQuoteLoading(false));
    return () => { active = false; };
  }, [filingPart, initializing]);

  const serviceConfig = configuration?.service;
  const payload = () => ({
    requestId, filingPart, nicCode, investment, expectedEmployment: employment,
    documents: files
  });
  const requiredDocuments = useMemo(() => (serviceConfig?.documents || []).filter(
    (document) => !document.filingParts || document.filingParts.includes(filingPart)
  ), [serviceConfig, filingPart]);
  const valid = /^\d{5}$/.test(nicCode) && Number(investment) > 0 &&
    Number(employment) > 0 && requiredDocuments.every(
      (document) => !document.required || files[document.id]?.status === "Uploaded"
    );

  const ensureDraft = async () => {
    if (requestId) return requestId;
    const data = await saveIemDraft(payload());
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
      const data = await uploadIemDocument(id, documentKey, file);
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
      await removeIemDocument(requestId, documentKey);
      setFiles((current) => ({ ...current, [documentKey]: { status: "Not Uploaded", name: null } }));
    } catch (requestError) {
      Swal.fire("Unable to remove document", requestError.response?.data?.message || "Please try again.", "error");
    } finally { setUploading(""); }
  };

  const downloadFile = async (documentKey) => {
    if (!requestId || !files[documentKey]?.name) return;
    try {
      await downloadIemDocument(requestId, documentKey, files[documentKey].name);
    } catch (requestError) {
      Swal.fire("Download failed", requestError.response?.data?.message || "The document could not be downloaded.", "error");
    }
  };

  const saveDraft = async () => {
    try {
      setBusy(true);
      const data = await saveIemDraft(payload());
      setRequestId(data.request.id);
      setDraftCode(data.request.request_code);
      await Swal.fire({ icon: "success", title: "Draft saved", text: "You can return and continue this IEM filing at any time.", confirmButtonColor: "#2952ff" });
    } catch (requestError) {
      Swal.fire("Unable to save draft", requestError.response?.data?.message || "Please try again.", "error");
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!valid) return;
    try {
      setBusy(true);
      const data = await submitIem(payload());
      setDraftCode("");
      const [nextQuote, nextLedger] = await Promise.all([getIemQuote(filingPart), getIemLedger()]);
      setQuote(nextQuote);
      setLedger(nextLedger);
      window.dispatchEvent(new CustomEvent("wallet:updated", { detail: {
        balance: data.balances.walletBalance, creditLine: data.balances.creditLineBalance
      } }));
      await Swal.fire({ icon: "success", title: "IEM request submitted", text: `${data.request.request_code} has been sent to the admin team.`, confirmButtonColor: "#2952ff" });
      onBack();
    } catch (requestError) {
      const code = requestError.response?.data?.errors?.code;
      if (requestError.response?.status === 402) {
        const text = code === "INSUFFICIENT_WALLET"
          ? "Wallet balance is insufficient. Please top up your Wallet."
          : code === "INSUFFICIENT_CREDIT_LINE"
            ? "Credit Line balance is insufficient. Please top up your Credit Line."
            : "Wallet and Credit Line balances are insufficient. Please top up both.";
        const result = await Swal.fire({ icon: "warning", title: "Top up required", text, showCancelButton: true, confirmButtonText: "Go to Wallet & Credit", confirmButtonColor: "#2952ff" });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else {
        Swal.fire("Unable to submit IEM request", requestError.response?.data?.message || "Please try again.", "error");
      }
    } finally { setBusy(false); }
  };

  const costs = quote || {};

  if (initializing) {
    return <IemLoadingView onBack={onBack} />;
  }

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {error && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">{error}</div>}
        {draftCode && <div className="mb-3 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900"><Save size={17} /><div><p className="text-xs font-bold">Draft {draftCode} restored</p><p className="text-[11px] text-blue-600">Continue where you left off.</p></div></div>}
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
          <header className="flex justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div className="flex gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-100"><BriefcaseBusiness /></div>
              <div><button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#2952ff]"><ArrowLeft size={16} /> Back to Compliance</button>
                <div className="mt-1 flex flex-wrap items-center gap-2"><h1 className="text-xl font-black uppercase">{serviceConfig?.name || "IEM Statutory Filing"}</h1><span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">{serviceConfig?.transactionType}</span></div>
                <p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Industrial Memorandum Mode<Zap size={11} className="text-amber-500" /> DPIIT Priority</p>
              </div></div>
            <button onClick={onBack} className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100"><X className="mx-auto" size={20} /></button>
          </header>
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {(serviceConfig?.filingParts || []).map((part) => <button key={part.id} onClick={() => setFilingPart(part.id)} className={`rounded-xl px-3 py-3 text-center ${filingPart === part.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}><strong className="block text-xs uppercase">{part.label}</strong><span className="text-[9px] uppercase">{part.description}</span></button>)}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field icon={<BriefcaseBusiness />} label="5-Digit NIC Code"><input maxLength="5" value={nicCode} onChange={(event) => setNicCode(event.target.value.replace(/\D/g, ""))} placeholder="E.g. 21001" /></Field>
                <Field icon={<Receipt />} label="Investment in P&M (INR Cr)"><input type="number" min="0" value={investment} onChange={(event) => setInvestment(event.target.value)} placeholder="Total machinery value" /></Field>
                <Field icon={<Users />} label="Expected Employment"><input type="number" min="0" value={employment} onChange={(event) => setEmployment(event.target.value)} placeholder="Total direct manpower" /></Field>
                <div className="space-y-1.5"><span className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500"><ShieldCheck size={16} />Sector Eligibility</span><div className="flex min-h-[48px] items-center justify-between rounded-xl bg-slate-50 px-4 text-sm font-black text-slate-500 shadow-inner"><span>{serviceConfig?.sectorEligibility || "Non-Compulsory Licensed"}</span><Info size={15} /></div></div>
              </div>
              <div><h2 className="mb-3 flex items-center gap-2 text-[11px] font-black uppercase tracking-[.18em]"><Upload size={14} /> Required Audit Evidence</h2>
                <div className="space-y-2">{requiredDocuments.map((document) => <article key={document.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3"><FileText className={files[document.id]?.status === "Uploaded" ? "text-emerald-500" : "text-slate-400"} /><div className="min-w-0 flex-1"><strong className="block text-xs">{document.label} {document.required && <em className="ml-1 not-italic text-[9px] text-rose-500">REQUIRED</em>}</strong><span className={`block truncate text-[10px] ${files[document.id]?.status === "Uploaded" ? "text-emerald-600" : "text-slate-400"}`}>{files[document.id]?.name || "Compliance file required"}</span></div>
                  {files[document.id]?.status === "Uploaded" && <><button onClick={() => downloadFile(document.id)} className="rounded-lg p-2 text-[#2952ff]" aria-label={`Download ${document.label}`}><Download size={16} /></button><button onClick={() => removeFile(document.id)} className="rounded-lg p-2 text-rose-500" aria-label={`Remove ${document.label}`}><Trash2 size={16} /></button></>}
                  <label className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase">{uploading === document.id ? "Uploading..." : files[document.id]?.status === "Uploaded" ? "Replace" : "Upload"}<input type="file" className="sr-only" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" onChange={(event) => selectFile(document.id, event)} /></label>
                </article>)}</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-relaxed text-amber-900"><strong>Statutory Note:</strong> IEM Part B must be filed immediately upon the commencement of commercial production. Failure to do so renders the IEM Part A intentions void and may lead to penal action under the IDR Act.</div>
            </div>
            <aside className={`overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl transition-opacity xl:sticky xl:top-24 xl:self-start ${quoteLoading ? "opacity-80" : "opacity-100"}`}>
              <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4 text-blue-400"><Receipt size={16} /><span className="text-[10px] font-black uppercase tracking-[.2em]">Transaction Ledger (INR)</span></div>
              <div className="space-y-5 p-5">
                <Ledger title="Prepaid Wallet" balance={costs.openingWalletBalance} feeLabel="Official Fees" fee={costs.officialFee} after={costs.closingWalletBalance} />
                <Ledger title="Corporate Credit Line" balance={costs.currentCreditLimit} feeLabel="Service Charges + GST" fee={Number(costs.serviceCharge || 0) + Number(costs.gst || 0)} after={costs.availableCreditAfter} />
              </div>
              <div className="flex items-center justify-between bg-[#2952ff] px-5 py-4"><div><span className="text-[9px] font-black uppercase tracking-widest text-blue-100">Final Payable</span><strong className="block text-2xl">₹{Number(costs.total || 0).toLocaleString("en-IN")}</strong></div><span className="text-right text-[9px] uppercase text-white/60">{ledger.transactions.length} recent<br />transactions</span></div>
            </aside>
          </div>
          <footer className="flex flex-col items-stretch justify-between gap-3 border-t bg-slate-50 px-5 py-4 sm:flex-row sm:items-center"><button onClick={onBack} className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400">Discard</button><div className="flex gap-3"><button onClick={saveDraft} disabled={busy || !serviceConfig} className="flex flex-1 items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"><Save size={16} /> Save Draft</button><button onClick={submit} disabled={busy || !valid} className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-[#2952ff] text-white shadow-lg shadow-blue-100" : "bg-slate-200 text-slate-400"}`}>{valid ? "Confirm & File Memo" : "Incomplete Audit"} <ArrowRight size={16} /></button></div></footer>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }) {
  return <label className="space-y-1.5"><span className="flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{icon}{label}</span><span className="iem-field-control block">{children}</span></label>;
}
function Ledger({ title, balance, feeLabel, fee, after }) {
  return <div><div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500"><span>{title}</span><Wallet size={14} /></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span className="text-slate-400">Opening Balance</span><strong>₹{Number(balance || 0).toLocaleString("en-IN")}</strong></div><div className="flex justify-between border-y border-white/10 py-2"><span className="text-slate-400">{feeLabel}</span><strong className="text-rose-400">- ₹{Number(fee || 0).toLocaleString("en-IN")}</strong></div><div className="flex justify-between"><span className="text-blue-400">Available Post-Task</span><strong>₹{Number(after || 0).toLocaleString("en-IN")}</strong></div></div></div>;
}

function IemLoadingView({ onBack }) {
  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="min-h-[720px] overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-blue-100" />
              <div>
                <button type="button" onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#2952ff]">
                  <ArrowLeft size={16} /> Back to Compliance
                </button>
                <div className="mt-2 h-5 w-52 animate-pulse rounded-lg bg-slate-200" />
              </div>
            </div>
            <button type="button" onClick={onBack} className="h-10 w-10 rounded-full text-slate-400 hover:bg-slate-100">
              <X className="mx-auto" size={20} />
            </button>
          </header>
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-5">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((item) => <div key={item} className="h-[74px] animate-pulse rounded-xl bg-slate-100" />)}
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((item) => <div key={item} className="h-[66px] animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            </div>
            <div className="h-[462px] animate-pulse rounded-3xl bg-slate-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
