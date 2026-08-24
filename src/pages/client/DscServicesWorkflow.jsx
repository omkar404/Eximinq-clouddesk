import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building,
  Camera,
  Download,
  FileText,
  Fingerprint,
  Mail,
  Receipt,
  Save,
  ShieldCheck,
  Smartphone,
  User,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import {
  downloadDscServicesDocument,
  getDscServicesConfiguration,
  getDscServicesLedger,
  getDscServicesQuote,
  getDscServicesRequests,
  removeDscServicesDocument,
  saveDscServicesDraft,
  submitDscServices,
  uploadDscServicesDocument,
} from "../../services/dscServicesService";

const emptyFile = { status: "Not Uploaded", name: null };

export default function DscServicesWorkflow({ onBack }) {
  const navigate = useNavigate();
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState({});
  const [ledger, setLedger] = useState({ transactions: [] });
  const [requestId, setRequestId] = useState(null);
  const [draftCode, setDraftCode] = useState("");
  const [applicantType, setApplicantType] = useState("Organization");
  const [dscClass, setDscClass] = useState("Class2");
  const [dscType, setDscType] = useState("Combo");
  const [validity, setValidity] = useState(2);
  const [applicantName, setApplicantName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emailId, setEmailId] = useState("");
  const [files, setFiles] = useState({});
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getDscServicesConfiguration(),
      getDscServicesRequests(),
      getDscServicesLedger(),
    ])
      .then(async ([config, data, ledgerData]) => {
        const draft = data.requests?.find((item) => item.status === "DRAFT");
        const payload = draft?.payload || {};
        const type = payload.applicantType || "Organization";
        const certificateClass = payload.dscClass || "Class2";
        const usage = payload.dscType || "Combo";
        const years = Number(payload.validity || 2);
        const pricing = await getDscServicesQuote(
          type,
          certificateClass,
          usage,
          years,
        );
        if (!active) return;
        const restored = Object.fromEntries(
          (config.service.documents || []).map((item) => [
            item.id,
            { ...emptyFile },
          ]),
        );
        for (const doc of draft?.documents || [])
          restored[doc.documentKey] = {
            status: "Uploaded",
            name: doc.name,
            size: Number(doc.size || 0),
          };
        setConfiguration(config);
        setQuote(pricing);
        setLedger(ledgerData);
        setRequestId(draft?.id || null);
        setDraftCode(draft?.request_code || "");
        setApplicantType(type);
        setDscClass(certificateClass);
        setDscType(usage);
        setValidity(years);
        setApplicantName(payload.applicantName || "");
        setMobileNumber(payload.mobileNumber || "");
        setEmailId(payload.emailId || "");
        setFiles(restored);
      })
      .catch(() => active && setError("Unable to load DSC Services."))
      .finally(() => active && setInitializing(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (initializing) return;
    const timer = setTimeout(
      () =>
        getDscServicesQuote(applicantType, dscClass, dscType, validity)
          .then((data) => {
            setQuote(data);
            setError("");
          })
          .catch(() => setError("Unable to calculate DSC pricing.")),
      250,
    );
    return () => clearTimeout(timer);
  }, [applicantType, dscClass, dscType, validity, initializing]);

  const config = configuration?.service;
  const documents = useMemo(
    () =>
      (config?.documents || []).filter(
        (item) =>
          !item.applicantTypes || item.applicantTypes.includes(applicantType),
      ),
    [config, applicantType],
  );
  const payload = () => ({
    requestId,
    applicantType,
    dscClass,
    dscType,
    validity: Number(validity),
    applicantName,
    mobileNumber,
    emailId,
    documents: files,
  });
  const isRequired = (item) =>
    item.required || item.requiredApplicantTypes?.includes(applicantType);
  const valid = Boolean(
    applicantName.trim() &&
    /^\d{10}$/.test(mobileNumber) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId) &&
    documents
      .filter(isRequired)
      .every((item) => files[item.id]?.status === "Uploaded"),
  );
  async function ensureDraft() {
    if (requestId) return requestId;
    const data = await saveDscServicesDraft(payload());
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
      const data = await uploadDscServicesDocument(id, key, file);
      setFiles((current) => ({
        ...current,
        [key]: {
          status: "Uploaded",
          name: data.document.name,
          size: data.document.size,
        },
      }));
    } catch (e) {
      Swal.fire(
        "Upload failed",
        e.response?.data?.message || "The document could not be uploaded.",
        "error",
      );
    } finally {
      setUploading("");
    }
  }
  async function removeFile(key) {
    try {
      setUploading(key);
      await removeDscServicesDocument(requestId, key);
      setFiles((current) => ({ ...current, [key]: { ...emptyFile } }));
    } catch (e) {
      Swal.fire(
        "Unable to remove document",
        e.response?.data?.message || "Please try again.",
        "error",
      );
    } finally {
      setUploading("");
    }
  }
  async function downloadFile(key) {
    try {
      await downloadDscServicesDocument(requestId, key, files[key]?.name);
    } catch (e) {
      Swal.fire(
        "Download failed",
        e.response?.data?.message || "The document could not be downloaded.",
        "error",
      );
    }
  }
  async function saveDraft() {
    try {
      setBusy(true);
      const data = await saveDscServicesDraft(payload());
      setRequestId(data.request.id);
      setDraftCode(data.request.request_code);
      await Swal.fire({
        icon: "success",
        title: "DSC draft saved",
        text: `${data.request.request_code} can be resumed later.`,
        confirmButtonColor: "#2952ff",
      });
    } catch (e) {
      Swal.fire(
        "Unable to save draft",
        e.response?.data?.message || "Please try again.",
        "error",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!valid) return;
    try {
      setBusy(true);
      const data = await submitDscServices(payload());
      const [pricing, nextLedger] = await Promise.all([
        getDscServicesQuote(applicantType, dscClass, dscType, validity),
        getDscServicesLedger(),
      ]);
      setQuote(pricing);
      setLedger(nextLedger);
      window.dispatchEvent(
        new CustomEvent("wallet:updated", {
          detail: {
            balance: data.balances.walletBalance,
            creditLine: data.balances.creditLineBalance,
          },
        }),
      );
      await Swal.fire({
        icon: "success",
        title: "DSC request submitted",
        text: `${data.request.request_code} has been sent to the Admin Request Board.`,
        confirmButtonColor: "#2952ff",
      });
      onBack();
    } catch (e) {
      if (e.response?.status === 402) {
        const code = e.response?.data?.errors?.code;
        const message =
          code === "INSUFFICIENT_WALLET"
            ? "Wallet balance is insufficient. Please top up your Wallet."
            : code === "INSUFFICIENT_CREDIT_LINE"
              ? "Credit Line balance is insufficient. Please top up your Credit Line."
              : "Wallet and Credit Line balances are insufficient. Please top up both.";
        const result = await Swal.fire({
          icon: "warning",
          title: "Top up required",
          text: message,
          showCancelButton: true,
          confirmButtonText: "Go to Wallet & Credit",
          confirmButtonColor: "#2952ff",
        });
        if (result.isConfirmed) navigate("/client/wallet-credit#add-credit");
      } else
        Swal.fire(
          "Unable to submit request",
          e.response?.data?.message || "Please try again.",
          "error",
        );
    } finally {
      setBusy(false);
    }
  }

  if (initializing)
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="min-h-[700px] animate-pulse rounded-[30px] bg-white shadow-lg" />
      </div>
    );
  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {error && (
          <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}
        {draftCode && (
          <div className="mb-3 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
            <Save size={17} />
            <div>
              <b className="text-xs">Draft {draftCode} restored</b>
              <p className="text-[11px] text-blue-600">
                Continue your DSC KYC and issuance request.
              </p>
            </div>
          </div>
        )}
        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,.08)]">
          <header className="flex justify-between border-b p-5">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white">
                <ShieldCheck />
              </div>
              <div>
                <button
                  onClick={onBack}
                  className="flex items-center gap-2 text-sm font-bold text-slate-500"
                >
                  <ArrowLeft size={16} /> Back to Compliance
                </button>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black">
                    DSC Procurement &amp; Validation
                  </h1>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                    Transactional
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
                  <Fingerprint size={12} className="text-[#2952ff]" />
                  {draftCode || "New DSC Request"}
                  <Zap size={11} className="text-amber-500" /> Priority issuance
                </p>
              </div>
            </div>
            <button onClick={onBack}>
              <X className="text-slate-400" />
            </button>
          </header>
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                <ApplicantButton
                  active={applicantType === "Individual"}
                  icon={<User size={14} />}
                  label="Individual"
                  onClick={() => setApplicantType("Individual")}
                />
                <ApplicantButton
                  active={applicantType === "Organization"}
                  icon={<Building size={14} />}
                  label="Organization"
                  onClick={() => setApplicantType("Organization")}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <SelectField
                  label="Certificate Class"
                  value={dscClass}
                  onChange={setDscClass}
                  options={config?.certificateClasses}
                />
                <SelectField
                  label="Usage Type"
                  value={dscType}
                  onChange={setDscType}
                  options={config?.usageTypes}
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Field label="Applicant Name (As per PAN)">
                    <input
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="Name exactly as on PAN card"
                    />
                  </Field>
                </div>
                <Field label="Mobile No. (for OTP)">
                  <span className="relative block">
                    <input
                      inputMode="numeric"
                      maxLength={10}
                      value={mobileNumber}
                      onChange={(e) =>
                        setMobileNumber(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Linked to Aadhaar"
                    />
                    <Smartphone
                      className="absolute right-3 top-3.5 text-slate-300"
                      size={16}
                    />
                  </span>
                </Field>
                <Field label="Email ID (for OTP)">
                  <span className="relative block">
                    <input
                      type="email"
                      value={emailId}
                      onChange={(e) => setEmailId(e.target.value)}
                      placeholder="Applicant's primary email"
                    />
                    <Mail
                      className="absolute right-3 top-3.5 text-slate-300"
                      size={16}
                    />
                  </span>
                </Field>
              </div>
              <div>
                <h2 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-[11px] font-black uppercase tracking-[.18em]">
                  <Camera size={14} /> Audit &amp; KYC Matrix
                </h2>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <article
                      key={doc.id}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 shadow-sm transition hover:border-blue-300"
                    >
                      <FileText
                        className={
                          files[doc.id]?.status === "Uploaded"
                            ? "text-emerald-500"
                            : "text-slate-400"
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <b className="block text-xs">
                          {doc.label}
                          {(doc.required || doc.displayRequired) && (
                            <em className="ml-2 not-italic text-[9px] font-black uppercase text-rose-500">
                              Required
                            </em>
                          )}
                        </b>
                        <span
                          className={`block truncate text-[10px] ${files[doc.id]?.status === "Uploaded" ? "font-bold text-emerald-600" : "text-slate-400"}`}
                        >
                          {files[doc.id]?.name || "Awaiting file..."}
                        </span>
                      </div>
                      {files[doc.id]?.status === "Uploaded" && (
                        <button
                          onClick={() => downloadFile(doc.id)}
                          title="Download uploaded document"
                          className="text-[#2952ff]"
                        >
                          <Download size={16} />
                        </button>
                      )}
                      {files[doc.id]?.status === "Uploaded" && (
                        <button
                          onClick={() => removeFile(doc.id)}
                          className="text-[10px] font-black uppercase text-rose-500"
                        >
                          Remove
                        </button>
                      )}
                      <label className="cursor-pointer rounded-lg border bg-white px-4 py-2 text-[10px] font-black uppercase hover:bg-slate-50">
                        {uploading === doc.id
                          ? "Uploading..."
                          : files[doc.id]?.status === "Uploaded"
                            ? "Replace"
                            : "Upload"}
                        <input
                          className="sr-only"
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => selectFile(doc.id, e)}
                        />
                      </label>
                    </article>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 rounded-xl border border-amber-100 bg-amber-50 p-3 text-amber-900">
                <AlertCircle size={16} />
                <p className="text-[10px] leading-relaxed">
                  <strong>OTP Notice:</strong> Applicant must have the
                  registered <strong>Mobile</strong> and <strong>Email</strong>{" "}
                  ready during the video verification link process (sent
                  post-payment).
                </p>
              </div>
            </div>
            <aside className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl xl:sticky xl:top-24 xl:self-start">
              <div className="flex items-center gap-2 border-b border-white/10 p-5 text-blue-400">
                <Receipt size={16} />
                <span className="text-[10px] font-black uppercase tracking-[.2em]">
                  Transaction Ledger (INR)
                </span>
              </div>
              <div className="space-y-5 p-5">
                <Ledger
                  title="Prepaid Wallet"
                  balance={quote.openingWalletBalance}
                  lines={[
                    [
                      `Official Fee (${validity} year${validity > 1 ? "s" : ""})`,
                      quote.officialFee,
                    ],
                  ]}
                  after={quote.closingWalletBalance}
                />
                <Ledger
                  title="Corporate Credit Line"
                  balance={quote.currentCreditLimit}
                  lines={[
                    ["DSC Processing", quote.baseServiceCharge],
                    ["Usage Surcharge", quote.usageSurcharge],
                    ["FIPS USB Token & Delivery", quote.tokenCost],
                    ["GST (18%)", quote.gst],
                  ]}
                  after={quote.availableCreditAfter}
                />
              </div>
              <div className="flex justify-between bg-[#2952ff] p-5">
                <div>
                  <span className="text-[9px] font-black uppercase text-blue-100">
                    Final Payable Amount
                  </span>
                  <b className="block text-2xl">
                    ₹{Number(quote.total || 0).toLocaleString("en-IN")}
                  </b>
                </div>
                <span className="text-right text-[9px] uppercase text-white/70">
                  {config?.sla}
                  <br />
                  {ledger.transactions.length} ledger entries
                </span>
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
            <div className="flex gap-3">
              <button
                onClick={saveDraft}
                disabled={busy}
                className="flex items-center gap-2 rounded-xl border bg-white px-6 py-3 text-sm font-bold"
              >
                <Save size={16} /> Save Draft
              </button>
              <button
                onClick={submit}
                disabled={busy || !valid}
                className={`flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black ${valid ? "bg-[#2952ff] text-white" : "bg-slate-200 text-slate-400"}`}
              >
                {valid ? "Process Payment & Verify" : "Complete Requirements"}
                {valid && <ArrowRight size={16} />}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ApplicantButton({ active, icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black ${active ? "border border-blue-100 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}
    >
      {icon}
      {label}
    </button>
  );
}
function SelectField({ label, value, onChange, options = [] }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
function Field({ label, children }) {
  return (
    <label className="space-y-1.5">
      <span className="px-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </span>
      <span className="iem-field-control block">{children}</span>
    </label>
  );
}
function Ledger({ title, balance, lines, after }) {
  return (
    <div>
      <div className="mb-3 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span>{title}</span>
        <Wallet size={14} />
      </div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Opening Balance</span>
          <b>₹{Number(balance || 0).toLocaleString("en-IN")}</b>
        </div>
        {lines
          .filter(([, amount]) => Number(amount) > 0)
          .map(([label, amount]) => (
            <div
              key={label}
              className="flex justify-between border-t border-white/10 pt-2"
            >
              <span className="text-slate-400">{label}</span>
              <b className="text-rose-400">
                - ₹{Number(amount || 0).toLocaleString("en-IN")}
              </b>
            </div>
          ))}
        <div className="flex justify-between border-t border-white/10 pt-2">
          <span className="text-blue-400">Available Post-Task</span>
          <b>₹{Number(after || 0).toLocaleString("en-IN")}</b>
        </div>
      </div>
    </div>
  );
}
