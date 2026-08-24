import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Camera,
  CheckCircle2,
  Download,
  Factory,
  FileCheck,
  History,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Receipt,
  Save,
  Trash2,
  Truck,
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

const SLUG = "factory-stuffing";
const money = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
    Number(value || 0),
  );
const errorText = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
const keyOf = (item) => item?.document_key || item?.documentKey || "";
const nameOf = (item) =>
  item?.original_name || item?.name || "Uploaded document";

export default function FactoryStuffingWorkflow({ onBack }) {
  const navigate = useNavigate(),
    fileInputs = useRef({});
  const [configuration, setConfiguration] = useState(null),
    [entity, setEntity] = useState({}),
    [draft, setDraft] = useState(null);
  const [form, setForm] = useState({
    requestType: "New",
    iecNumber: "",
    commissionerate: "",
    factoryAddress: "",
    prevPermissionNo: "",
    estMonthlyContainers: "",
    hasCctv: "false",
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
          requestType: "New",
          iecNumber: configData.clientContext?.iecNumber || "",
          commissionerate: "",
          factoryAddress: "",
          prevPermissionNo: "",
          estMonthlyContainers: "",
          hasCctv: "false",
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
          "Unable to load Factory Stuffing",
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
    () =>
      [
        {
          id: "prevPermission",
          label: "Previous Stuffing Permission Copy",
          required: true,
          show: form.requestType === "Renewal",
          icon: <History size={20} />,
        },
        {
          id: "factoryPhotos",
          label: "Geo-Tagged Bay & Perimeter Photos",
          required: true,
          icon: <Camera size={20} />,
        },
        {
          id: "sitePlan",
          label: "Updated Factory Site Plan",
          required: true,
          icon: <MapPin size={20} />,
        },
        {
          id: "factoryOwnership",
          label: "Ownership / Valid Lease Deed",
          required: true,
          icon: <Building2 size={20} />,
        },
        {
          id: "selfSealingDecl",
          label: "Self-Sealing Undertaking",
          required: true,
          icon: <FileCheck size={20} />,
        },
        {
          id: "iecGstCopy",
          label: "IEC & GST Registration Copy",
          required: false,
          icon: <FileCheck size={20} />,
        },
      ].filter((item) => item.show !== false),
    [form.requestType],
  );
  async function updateField(field, value) {
    const next = { ...form, [field]: value };
    if (field === "requestType" && value === "New") next.prevPermissionNo = "";
    setForm(next);
    try {
      setQuote(await getLicensingQuote(SLUG, next));
    } catch {
      setQuote(null);
    }
  }
  function validationMessage() {
    if (form.commissionerate.trim().length < 3)
      return "Enter the jurisdictional Customs Commissionerate.";
    if (form.factoryAddress.trim().length < 10)
      return "Enter the complete factory or warehouse address.";
    const volume = Number(form.estMonthlyContainers);
    if (!Number.isInteger(volume) || volume < 1 || volume > 100000)
      return "Enter a valid monthly container volume.";
    if (form.hasCctv !== "true")
      return "Confirm that the required infrastructure and CCTV standards are met.";
    if (
      form.requestType === "Renewal" &&
      form.prevPermissionNo.trim().length < 5
    )
      return "Enter the previous stuffing permission number.";
    const uploaded = new Set(documents.map(keyOf));
    const missing = documentRules.find(
      (item) => item.required && !uploaded.has(item.id),
    );
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
        title: "Factory stuffing audit saved",
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
        "Unable to save application",
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
        title: "Factory stuffing application is incomplete",
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
        title: "Factory stuffing application submitted",
        text: `${response.request.request_code} has been sent for Customs review.`,
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
          "Unable to submit application",
          errorText(error, "Please verify the application and evidence."),
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
        Loading Factory Stuffing…
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
              <Factory />
            </div>
            <div>
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-sm font-bold text-slate-500"
              >
                <ArrowLeft size={16} />
                Back to Logistics
              </button>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black uppercase">
                  Factory Stuffing Permission
                </h1>
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                  Logistics
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
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
              {[
                ["New", "New Permission"],
                ["Renewal", "Permission Renewal"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => updateField("requestType", id)}
                  className={`rounded-xl py-3 text-[10px] font-black uppercase ${form.requestType === id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Jurisdictional Commissionerate">
                <input
                  value={form.commissionerate}
                  onChange={(e) =>
                    updateField("commissionerate", e.target.value)
                  }
                  placeholder="e.g. Mumbai Customs Zone II"
                />
              </Field>
              <Field label="Factory / Warehouse Address">
                <input
                  value={form.factoryAddress}
                  onChange={(e) =>
                    updateField("factoryAddress", e.target.value)
                  }
                  placeholder="Full address for Customs inspection"
                />
              </Field>
              {form.requestType === "Renewal" && (
                <Field label="Previous Permission Number">
                  <input
                    value={form.prevPermissionNo}
                    onChange={(e) =>
                      updateField("prevPermissionNo", e.target.value)
                    }
                    placeholder="e.g. STF/CBIC/2025/45"
                  />
                </Field>
              )}
              <Field label="Average Monthly Containers">
                <input
                  type="number"
                  min="1"
                  max="100000"
                  value={form.estMonthlyContainers}
                  onChange={(e) =>
                    updateField("estMonthlyContainers", e.target.value)
                  }
                  placeholder="e.g. 15"
                />
              </Field>
            </div>
            <button
              type="button"
              onClick={() =>
                updateField(
                  "hasCctv",
                  form.hasCctv === "true" ? "false" : "true",
                )
              }
              className={`flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left transition ${form.hasCctv === "true" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"}`}
            >
              <span className="flex items-center gap-3">
                <PackageCheck
                  className={
                    form.hasCctv === "true"
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }
                />
                <span>
                  <b className="block text-xs uppercase">
                    Infrastructure and CCTV Standards Met
                  </b>
                  <small className="text-slate-500">
                    Self-sealing bay, perimeter CCTV and inspection access are
                    operational.
                  </small>
                </span>
              </span>
              <span
                className={`relative h-6 w-11 rounded-full ${form.hasCctv === "true" ? "bg-emerald-600" : "bg-slate-300"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${form.hasCctv === "true" ? "left-6" : "left-1"}`}
                />
              </span>
            </button>
            {Number(form.estMonthlyContainers) > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-950 p-5 text-white">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    Estimated annual logistics savings
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    ₹{money(price.annualSavings)}
                  </p>
                  <small className="text-slate-500">
                    ₹8,000 × monthly containers × 12
                  </small>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                    Success fee (1%)
                  </p>
                  <p className="text-lg font-black text-blue-300">
                    ₹{money(price.successFee)}
                  </p>
                </div>
              </div>
            )}
            <div>
              <h2 className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-slate-800">
                Documentation Evidence
              </h2>
              <div className="grid gap-2 lg:grid-cols-2">
                {documentRules.map((item) => {
                  const saved = documents.find((doc) => keyOf(doc) === item.id);
                  return (
                    <article
                      key={item.id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${saved ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                      >
                        {saved ? <CheckCircle2 size={20} /> : item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <b className="block text-xs">
                          {item.label}
                          <em
                            className={`ml-2 text-[8px] not-italic uppercase ${item.required ? "text-rose-500" : "text-slate-400"}`}
                          >
                            {item.required ? "Required" : "Optional"}
                          </em>
                        </b>
                        <span
                          className={`block truncate text-[10px] ${saved ? "text-emerald-600" : "text-slate-400"}`}
                        >
                          {saved
                            ? nameOf(saved)
                            : "PDF, DOC, JPG or PNG · max 20 MB"}
                        </span>
                      </div>
                      {saved && (
                        <>
                          <button
                            onClick={() =>
                              downloadDocument(item.id, nameOf(saved))
                            }
                            className="p-2 text-[#2952ff]"
                            aria-label={`Download ${item.label}`}
                          >
                            <Download size={15} />
                          </button>
                          <button
                            onClick={() => removeDocument(item.id)}
                            className="p-2 text-rose-500"
                            aria-label={`Remove ${item.label}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => fileInputs.current[item.id]?.click()}
                        disabled={Boolean(uploading)}
                        className="rounded-lg border px-3 py-2 text-[9px] font-black uppercase disabled:opacity-50"
                      >
                        <Upload className="mr-1 inline" size={13} />
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
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(event) => uploadDocument(item.id, event)}
                      />
                    </article>
                  );
                })}
              </div>
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
              <Ledger label="Official fee" value={price.officialFee} />
              <Ledger
                label={`${form.requestType} drafting fee`}
                value={price.draftingFee}
              />
              <Ledger
                label="Logistics success fee (1%)"
                value={price.successFee}
              />
              <Ledger label="GST (18%)" value={price.gst} />
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
                  Total application debit
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
              {valid ? "Confirm & Submit" : "Incomplete Application"}
              <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">
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
