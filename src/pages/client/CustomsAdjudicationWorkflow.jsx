import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCheck,
  FileSignature,
  Gavel,
  LoaderCircle,
  Receipt,
  Save,
  Scale,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import {
  downloadLicensingDocument,
  getLicensingConfiguration,
  getLicensingLedger,
  getLicensingQuote,
  getLicensingRequests,
  removeLicensingDocument,
  saveLicensingDraft,
  submitLicensingRequest,
  uploadLicensingDocument,
} from "../../services/licensingService";

const SLUG = "customs-adjudication";
const money = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );
const errorText = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
const keyOf = (item) => item?.document_key || item?.documentKey || "";
const nameOf = (item) =>
  item?.original_name || item?.name || "Uploaded document";
const STAGES = [
  { id: "SCN", title: "SCN Defence", subtitle: "Response" },
  { id: "PersonalHearing", title: "Hearing", subtitle: "Representation" },
  { id: "Appeal", title: "Appeals", subtitle: "Commissioner Appeals" },
];

export default function CustomsAdjudicationWorkflow({ onBack }) {
  const navigate = useNavigate(),
    fileInputs = useRef({});
  const [configuration, setConfiguration] = useState(null),
    [entity, setEntity] = useState({}),
    [draft, setDraft] = useState(null);
  const [form, setForm] = useState({
    litigationType: "SCN",
    iecNumber: "",
    scnNumber: "",
    demandValue: "",
    customsSection: "",
    portCode: "",
  });
  const [documents, setDocuments] = useState([]),
    [quote, setQuote] = useState(null),
    [ledger, setLedger] = useState(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([
      getLicensingConfiguration(SLUG),
      getLicensingRequests(SLUG),
      getLicensingLedger(SLUG),
    ])
      .then(async ([configData, requestData, ledgerData]) => {
        const restored = requestData.requests?.find(
          (item) => item.status === "DRAFT",
        );
        const nextForm = {
          litigationType: "SCN",
          iecNumber: configData.clientContext?.iecNumber || "",
          scnNumber: "",
          demandValue: "",
          customsSection: "",
          portCode: "",
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
      })
      .catch((error) =>
        Swal.fire(
          "Unable to load Customs Adjudication",
          errorText(error, "Please try again shortly."),
          "error",
        ),
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);
  const documentRules = useMemo(
    () => [
      { id: "scnCopy", label: "Show Cause Notice Copy" },
      ...(form.litigationType === "Appeal"
        ? [
            { id: "oioCopy", label: "Order-in-Original for Appeal" },
            {
              id: "preDepositChallan",
              label: "7.5% Pre-Deposit Payment Challan",
            },
          ]
        : []),
      { id: "defenseReply", label: "Draft Defence Reply / Brief Note" },
      {
        id: "evidenceFolder",
        label: "Technical Evidence Folder · Specifications",
      },
      { id: "authLetter", label: "Authorised Signatory Board Resolution" },
    ],
    [form.litigationType],
  );
  async function updateField(field, value) {
    const next = { ...form, [field]: value };
    setForm(next);
    try {
      setQuote(await getLicensingQuote(SLUG, next));
    } catch {
      setQuote(null);
    }
  }
  function validationMessage() {
    if (form.scnNumber.trim().length < 5)
      return "Enter a valid Notice or SCN number.";
    if (form.customsSection.trim().length < 3)
      return "Enter the relevant Customs Act section.";
    if (!/^[A-Z0-9]{5,10}$/.test(form.portCode))
      return "Enter a valid 5 to 10 character Customs port code.";
    if (Number(form.demandValue) <= 0)
      return "Enter the total demand value greater than zero.";
    const uploaded = new Set(documents.map(keyOf));
    const missing = documentRules.find((item) => !uploaded.has(item.id));
    return missing ? `Upload the required document: ${missing.label}.` : "";
  }
  async function persistDraft(show = true) {
    const response = await saveLicensingDraft(SLUG, {
      requestId: draft?.id,
      form,
    });
    setDraft(response.request);
    if (show)
      await Swal.fire({
        icon: "success",
        title: "Legal draft secured",
        text: `${response.request.request_code} can be resumed later.`,
        confirmButtonColor: "#2952ff",
      });
    return response.request;
  }
  async function saveDraft() {
    try {
      setBusy(true);
      await persistDraft();
    } catch (error) {
      Swal.fire(
        "Unable to save legal draft",
        errorText(error, "Please try again."),
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  async function uploadDocument(key, event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setUploading(key);
      const request = draft || (await persistDraft(false));
      const response = await uploadLicensingDocument(
        SLUG,
        request.id,
        key,
        file,
      );
      setDocuments((current) => [
        ...current.filter((item) => keyOf(item) !== key),
        response.document,
      ]);
    } catch (error) {
      Swal.fire(
        "Upload failed",
        errorText(error, "The document could not be uploaded."),
        "error",
      );
    } finally {
      setUploading("");
    }
  }
  async function removeDocument(key) {
    if (!draft) return;
    try {
      setUploading(key);
      await removeLicensingDocument(SLUG, draft.id, key);
      setDocuments((current) => current.filter((item) => keyOf(item) !== key));
    } catch (error) {
      Swal.fire(
        "Unable to remove file",
        errorText(error, "Please try again."),
        "error",
      );
    } finally {
      setUploading("");
    }
  }
  async function downloadDocument(key, name) {
    try {
      await downloadLicensingDocument(SLUG, draft.id, key, name);
    } catch (error) {
      Swal.fire(
        "Unable to download file",
        errorText(error, "Please try again."),
        "error",
      );
    }
  }
  async function submit() {
    const missing = validationMessage();
    if (missing)
      return Swal.fire({
        icon: "error",
        title: "Legal defence is incomplete",
        text: missing,
        confirmButtonColor: "#2952ff",
      });
    try {
      setBusy(true);
      const request = await persistDraft(false);
      const response = await submitLicensingRequest(SLUG, {
        requestId: request.id,
        form,
      });
      setLedger(await getLicensingLedger(SLUG));
      window.dispatchEvent(
        new CustomEvent("wallet:updated", {
          detail: {
            balance: response.balances?.walletBalance,
            creditLine: response.balances?.creditLineBalance,
          },
        }),
      );
      await Swal.fire({
        icon: "success",
        title: "Legal defence submitted",
        text: `${response.request.request_code} has been sent for adjudication review.`,
        confirmButtonColor: "#2952ff",
      });
      onBack();
    } catch (error) {
      if (error.response?.status === 402) {
        const result = await Swal.fire({
          icon: "warning",
          title: "Top up required",
          text: "Your Wallet or Credit Line balance is insufficient.",
          showCancelButton: true,
          confirmButtonText: "Go to Wallet & Credit",
          confirmButtonColor: "#2952ff",
        });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else
        Swal.fire(
          "Unable to submit legal defence",
          errorText(error, "Please verify the case details and evidence."),
          "error",
        );
    } finally {
      setBusy(false);
    }
  }
  if (loading || !configuration)
    return (
      <div className="flex min-h-[520px] items-center justify-center text-slate-500">
        <LoaderCircle className="mr-2 animate-spin" />
        Loading Customs Adjudication…
      </div>
    );
  const valid = !validationMessage(),
    price = quote || {},
    balances = ledger?.balances || {};
  return (
    <section className="mx-auto max-w-[1370px] animate-in fade-in duration-300">
      <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
        <header className="flex items-start justify-between border-b px-5 py-5 md:px-7">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-100">
              <Gavel />
            </div>
            <div>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-500"
              >
                <ArrowLeft size={16} />
                Back to Dispute Resolution
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black uppercase">
                  Customs Adjudication Defence
                </h1>
                <span className="rounded-full bg-rose-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                  High Risk
                </span>
              </div>
              <p className="mt-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                {draft?.request_code || "Reference generated on save"} ·{" "}
                {entity.companyName || "Company"}
                {form.iecNumber ? ` · IEC ${form.iecNumber}` : ""}
              </p>
            </div>
          </div>
          <button onClick={onBack} aria-label="Close workflow">
            <X className="text-slate-400" />
          </button>
        </header>
        <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[minmax(0,1.4fr)_360px]">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
              {STAGES.map((stage) => (
                <button
                  key={stage.id}
                  onClick={() => updateField("litigationType", stage.id)}
                  className={`rounded-lg py-3 text-center ${form.litigationType === stage.id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}
                >
                  <b className="block text-[10px] uppercase">{stage.title}</b>
                  <span className="text-[8px] font-bold uppercase opacity-70">
                    {stage.subtitle}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Notice / SCN Number"
                icon={<FileSignature size={13} />}
              >
                <input
                  value={form.scnNumber}
                  onChange={(e) =>
                    updateField("scnNumber", e.target.value.toUpperCase())
                  }
                  placeholder="e.g. SCN/123/2024/G-II"
                  maxLength={120}
                />
              </Field>
              <Field
                label="Relevant Section · Customs Act"
                icon={<Scale size={13} />}
              >
                <input
                  value={form.customsSection}
                  onChange={(e) =>
                    updateField("customsSection", e.target.value)
                  }
                  placeholder="e.g. Section 111 / 112"
                  maxLength={120}
                />
              </Field>
              <Field label="Customs Port Code" icon={<Search size={13} />}>
                <input
                  value={form.portCode}
                  onChange={(e) =>
                    updateField(
                      "portCode",
                      e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 10),
                    )
                  }
                  placeholder="e.g. INNSA1"
                  maxLength={10}
                />
              </Field>
              <Field
                label="Total Demand Value (INR)"
                icon={<TrendingUp size={13} />}
              >
                <input
                  type="number"
                  min="1"
                  value={form.demandValue}
                  onChange={(e) => updateField("demandValue", e.target.value)}
                  placeholder="Duty + penalty + interest"
                />
              </Field>
            </div>
            <div className="flex gap-4 rounded-2xl border bg-blue-50 p-4">
              <div className="rounded-xl bg-white p-3 text-[#2952ff] shadow-sm">
                {form.litigationType === "SCN" ? (
                  <ShieldAlert size={21} />
                ) : (
                  <Scale size={21} />
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Defence strategy
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {form.litigationType === "SCN"
                    ? "Prepare the response to confiscation allegations with technical justification and bona-fide-belief evidence."
                    : form.litigationType === "Appeal"
                      ? `Contest the OIO with a Statement of Facts and verify the statutory 7.5% pre-deposit of ₹${money(price.preDeposit)}.`
                      : "Prepare the written brief and oral representation to prevent an ex-parte order."}
                </p>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-800">
                Required legal evidence
              </h2>
              <div className="space-y-2">
                {documentRules.map((item) => {
                  const saved = documents.find((doc) => keyOf(doc) === item.id);
                  return (
                    <article
                      key={item.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300"
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${saved ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                      >
                        {saved ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <FileCheck size={20} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <b className="block text-xs">
                          {item.label}
                          <em className="ml-2 text-[9px] not-italic uppercase text-rose-500">
                            Required
                          </em>
                        </b>
                        <span
                          className={`block truncate text-[10px] ${saved ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          {saved
                            ? nameOf(saved)
                            : "PDF, DOC, XLS, JPG or PNG · maximum 20 MB"}
                        </span>
                      </div>
                      {saved && (
                        <>
                          <button
                            onClick={() =>
                              downloadDocument(item.id, nameOf(saved))
                            }
                            className="rounded-lg p-2 text-[#2952ff]"
                            aria-label={`Download ${item.label}`}
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => removeDocument(item.id)}
                            className="rounded-lg p-2 text-rose-500"
                            aria-label={`Remove ${item.label}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => fileInputs.current[item.id]?.click()}
                        disabled={Boolean(uploading)}
                        className="rounded-lg border bg-white px-4 py-2 text-[10px] font-black uppercase disabled:opacity-50"
                      >
                        <Upload className="mr-1 inline" size={14} />
                        {uploading === item.id
                          ? "Uploading"
                          : saved
                            ? "Replace"
                            : "Upload"}
                      </button>
                      <input
                        ref={(node) => {
                          fileInputs.current[item.id] = node;
                        }}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={(event) => uploadDocument(item.id, event)}
                      />
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-[10px] font-black uppercase leading-relaxed text-amber-800">
              <ShieldAlert className="shrink-0" size={18} />
              <p>
                SCN responses are ordinarily time-sensitive. Missing the
                response or hearing may result in ex-parte penalties and cargo
                confiscation.
              </p>
            </div>
          </div>
          <aside className="h-fit overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl xl:sticky xl:top-24">
            <div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400">
              <Receipt size={16} />
              <span className="text-[10px] font-black uppercase tracking-[.2em]">
                Transaction Ledger
              </span>
            </div>
            <div className="space-y-4 p-5">
              <Ledger
                label="Official portal filing fee"
                value={price.officialFee}
              />
              <Ledger
                label="Legal drafting & preparation"
                value={price.draftingFee}
              />
              <Ledger
                label="Demand stay premium (1%)"
                value={price.successFee}
              />
              <Ledger label="GST (18%)" value={price.gst} />
              {form.litigationType === "Appeal" && (
                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs">
                  <span className="text-amber-300">
                    Statutory pre-deposit · separate
                  </span>
                  <b className="float-right text-amber-200">
                    ₹{money(price.preDeposit)}
                  </b>
                </div>
              )}
              <div className="border-t border-white/10 pt-3 text-xs text-slate-400">
                <p>
                  Wallet after:{" "}
                  <b className="float-right text-white">
                    ₹{money(price.closingWalletBalance)}
                  </b>
                </p>
                <p className="mt-2">
                  Credit line after:{" "}
                  <b className="float-right text-white">
                    ₹{money(price.availableCreditAfter)}
                  </b>
                </p>
              </div>
              <div className="rounded-2xl bg-[#2952ff] p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-blue-100">
                  Total professional debit
                </p>
                <p className="mt-1 text-3xl font-black">
                  ₹{money(price.total)}
                </p>
              </div>
              <p className="text-[10px] text-slate-500">
                Balances: Wallet ₹{money(balances.walletBalance)} · Credit ₹
                {money(balances.creditLineBalance)}
              </p>
            </div>
          </aside>
        </div>
        <footer className="flex flex-col justify-between gap-3 border-t bg-slate-50 p-5 sm:flex-row">
          <button
            onClick={onBack}
            className="text-[10px] font-black uppercase tracking-[.2em] text-slate-400"
          >
            Discard
          </button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={saveDraft}
              disabled={busy || Boolean(uploading)}
              className="flex items-center justify-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold disabled:opacity-50"
            >
              <Save size={16} />
              Save Draft
            </button>
            <button
              onClick={submit}
              disabled={busy || Boolean(uploading)}
              className={`flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-black disabled:opacity-50 ${valid ? "bg-[#2952ff] text-white" : "border bg-slate-100 text-slate-500"}`}
            >
              {valid ? "Confirm & File Defence" : "Incomplete Audit"}
              <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">
        {icon}
        {label}
        <em className="not-italic text-rose-500">*</em>
      </span>
      <span className="iem-field-control block">{children}</span>
    </label>
  );
}
function Ledger({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-slate-400">{label}</span>
      <b className="text-rose-400">− ₹{money(value)}</b>
    </div>
  );
}
