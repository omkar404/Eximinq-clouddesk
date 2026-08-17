import { useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getLicensingConfiguration,
  getLicensingLedger,
  getLicensingQuote,
  getLicensingRequests,
  removeLicensingDocument,
  saveLicensingDraft,
  submitLicensingRequest,
  uploadLicensingDocument,
} from "../../services/licensingService";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value || 0));

const visible = (item, form) =>
  !item.visibleWhen || String(form[item.visibleWhen.field]) === String(item.visibleWhen.equals);

const errorText = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const normalizeDocument = (document) => ({
  ...document,
  document_key: document?.document_key || document?.documentKey || document?.key || "",
  original_name:
    document?.original_name ||
    document?.originalName ||
    document?.name ||
    "Uploaded document",
});

const normalizePricing = (payload) => {
  const pricing = payload?.pricing || payload || {};

  return {
    ...pricing,
    totalPayable: pricing.totalPayable ?? pricing.total ?? 0,
    walletAfter:
      pricing.walletAfter ??
      pricing.closingWalletBalance ??
      pricing.walletBalance ??
      0,
    creditLineAfter:
      pricing.creditLineAfter ??
      pricing.availableCreditAfter ??
      pricing.creditLineBalance ??
      0,
  };
};

const normalizeLedger = (payload) => {
  const financialContext = payload?.financialContext || payload?.balances || {};

  return {
    ...payload,
    financialContext: {
      ...financialContext,
      creditLineAvailable:
        financialContext.creditLineAvailable ??
        financialContext.creditLineBalance ??
        financialContext.availableCredit ??
        0,
    },
  };
};

export default function LicensingServiceWorkflow({ service, onBack }) {
  const [configuration, setConfiguration] = useState(null);
  const [form, setForm] = useState({});
  const [draft, setDraft] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [quote, setQuote] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputs = useRef({});

  const activeDocuments = useMemo(
    () => (configuration?.documents || []).filter((item) => visible(item, form)),
    [configuration, form],
  );

  const refreshQuote = async (nextForm) => {
    const response = await getLicensingQuote(service.id, nextForm);
    setQuote(normalizePricing(response));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [configResponse, requestResponse, ledgerResponse] = await Promise.all([
          getLicensingConfiguration(service.id),
          getLicensingRequests(service.id),
          getLicensingLedger(service.id),
        ]);
        if (!mounted) return;
        const restored = (requestResponse.requests || []).find((request) => request.status === "DRAFT");
        const serviceConfiguration = configResponse.service || configResponse.config || null;
        const defaults = Object.fromEntries(
          (serviceConfiguration?.fields || []).map((field) => [
            field.id,
            field.id === "iecNumber" || field.id === "companyIec"
              ? configResponse.clientContext?.iecNumber || ""
              : field.defaultValue || "",
          ]),
        );
        const savedForm =
          restored?.payload?.form ||
          restored?.payload?.formData ||
          restored?.form_data ||
          restored?.formData ||
          {};
        const nextForm = { ...defaults, ...savedForm };
        setConfiguration(serviceConfiguration);
        setForm(nextForm);
        setDraft(restored || null);
        setDocuments((restored?.documents || []).map(normalizeDocument));
        setLedger(normalizeLedger(ledgerResponse));
        await refreshQuote(nextForm);
      } catch (error) {
        if (mounted) {
          await Swal.fire("Unable to load service", errorText(error, "Please try again shortly."), "error");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [service.id]);

  const updateForm = async (field, value) => {
    const next = { ...form, [field]: value };
    setForm(next);
    try { await refreshQuote(next); } catch { setQuote(null); }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      const response = await saveLicensingDraft(service.id, { requestId: draft?.id, form });
      setDraft(response.request);
      return response.request;
    } catch (error) {
      await Swal.fire("Unable to save draft", errorText(error, "Please try again."), "error");
      throw error;
    } finally { setSaving(false); }
  };

  const chooseFile = (key) => fileInputs.current[key]?.click();

  const uploadDocument = async (documentKey, event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const request = draft || await saveDraft();
      const response = await uploadLicensingDocument(service.id, request.id, documentKey, file);
      setDraft(response.request || request);
      const nextDocument = normalizeDocument(response.document);
      setDocuments((current) => [
        ...current.filter(
          (document) => document.document_key !== nextDocument.document_key,
        ),
        nextDocument,
      ]);
    } catch (_) {
      // The save helper already displayed the relevant error.
    } finally { event.target.value = ""; }
  };

  const removeDocument = async (documentKey) => {
    if (!draft) return;
    try {
      await removeLicensingDocument(service.id, draft.id, documentKey);
      setDocuments((current) => current.filter((document) => document.document_key !== documentKey));
    } catch (error) {
      await Swal.fire("Unable to remove file", errorText(error, "Please try again."), "error");
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const request = draft || await saveDraft();
      const response = await submitLicensingRequest(service.id, { requestId: request.id, form });
      setDraft(response.request);
      setLedger(normalizeLedger(await getLicensingLedger(service.id)));
      await Swal.fire({
        icon: "success",
        title: response.request.status === "SUBMITTED" ? "Application submitted" : "Request created",
        text: `Reference: ${response.request.request_code}`,
      });
      onBack();
    } catch (error) {
      await Swal.fire("Submission could not be completed", errorText(error, "Check the required details and balances."), "error");
    } finally { setSaving(false); }
  };

  if (loading || !configuration) {
    return <div className="flex min-h-[420px] items-center justify-center text-slate-500"><LoaderCircle className="mr-2 animate-spin" size={22} /> Loading service workflow…</div>;
  }

  const price = quote || {};
  const quoteRequired = price.quoteRequired || configuration.pricing?.quoteRequired;

  return (
    <section className="mx-auto max-w-[1370px] animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <header className="border-b border-slate-200 px-6 py-5 md:px-8">
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600"><ArrowLeft size={17} /> Back to Licensing</button>
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-200"><FileText size={25} /></div>
            <div><div className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600">Licensing workflow</div><h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">{configuration.title || service.name}</h1><p className="mt-1 text-sm text-slate-500">{configuration.description || service.description}</p></div>
          </div>
        </header>
        <div className="grid gap-7 p-6 lg:grid-cols-[minmax(0,1fr)_355px] md:p-8">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(configuration.fields || []).filter((field) => visible(field, form)).map((field) => (
                <label key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{field.label}{field.required && <span className="ml-1 text-rose-500">*</span>}</span>
                  {field.type === "select" ? (
                    <select value={form[field.id] || ""} onChange={(event) => updateForm(field.id, event.target.value)} disabled={field.readonly} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50">
                      <option value="">Select an option</option>{(field.options || []).map((option) => <option key={option.value || option} value={option.value || option}>{option.label || option}</option>)}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea rows="3" value={form[field.id] || ""} onChange={(event) => updateForm(field.id, event.target.value)} placeholder={field.placeholder || "Enter details"} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50" />
                  ) : (
                    <input type={field.type || "text"} value={form[field.id] || ""} onChange={(event) => updateForm(field.id, event.target.value)} placeholder={field.placeholder || "Enter details"} readOnly={field.readonly} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50 read-only:bg-slate-50" />
                  )}
                </label>
              ))}
            </div>
            <div className="mt-7"><h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.16em] text-slate-800">Required supporting documents</h2><div className="grid gap-3 sm:grid-cols-2">{activeDocuments.map((item) => { const document = documents.find((saved) => saved.document_key === item.id); return <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><input ref={(node) => { fileInputs.current[item.id] = node; }} onChange={(event) => uploadDocument(item.id, event)} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" /><div className="flex gap-3"><div className={document ? "rounded-xl bg-emerald-100 p-2 text-emerald-600" : "rounded-xl bg-blue-100 p-2 text-blue-600"}><FileText size={19} /></div><div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-800">{item.label} {item.required && <span className="text-rose-500">Required</span>}</p><p className="mt-1 truncate text-xs text-slate-500">{document ? document.original_name : item.hint || "No file attached"}</p></div></div><div className="mt-3 flex gap-2">{document && <button onClick={() => removeDocument(item.id)} className="rounded-lg border border-rose-200 px-2 py-2 text-rose-600 hover:bg-rose-50" title="Remove file"><Trash2 size={15} /></button>}<button onClick={() => chooseFile(item.id)} className="ml-auto inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50"><Upload size={15} /> {document ? "Replace" : "Attach file"}</button></div></div>; })}</div></div>
          </div>
          <aside className="h-fit overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl"><div className="border-b border-white/10 px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-blue-300">Transaction ledger (INR)</div><div className="space-y-4 p-5">{quoteRequired ? <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4"><p className="font-bold">Pricing after review</p><p className="mt-2 text-sm leading-6 text-slate-300">This statutory workflow requires an eligibility review. Save your draft or submit the request to receive a written quote.</p></div> : <><LedgerRow label="Official fees — wallet" value={price.officialFee} negative /><LedgerRow label="Service charges — credit line" value={price.serviceCharge} negative /><LedgerRow label="GST" value={price.gst} negative /><div className="border-t border-white/10 pt-3"><LedgerRow label="Wallet after task" value={price.walletAfter} /><LedgerRow label="Credit line after task" value={price.creditLineAfter} /></div><div className="rounded-2xl bg-blue-600 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">Total payable</p><p className="mt-1 text-3xl font-extrabold">₹{currency(price.totalPayable)}</p></div></>}<div className="border-t border-white/10 pt-4 text-xs text-slate-400">Wallet: ₹{currency(ledger?.financialContext?.walletBalance)} · Credit line: ₹{currency(ledger?.financialContext?.creditLineAvailable)}</div></div></aside>
        </div>
        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end md:px-8"><button onClick={saveDraft} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-60"><Save size={17} /> Save draft</button><button onClick={submit} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60"><CheckCircle2 size={17} /> {quoteRequired ? "Submit for review" : "Submit application"}</button></footer>
      </div>
    </section>
  );
}

function LedgerRow({ label, value, negative = false }) {
  return <div className="flex items-center justify-between gap-4 text-sm"><span className="text-slate-400">{label}</span><strong className={negative ? "text-rose-400" : "text-white"}>{negative ? "−" : ""}₹{currency(value)}</strong></div>;
}
