/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  LoaderCircle,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  addRcmcRecord,
  createRcmcApplication,
  deleteRcmcAttachment,
  deleteRcmcRecord,
  downloadRcmcAttachment,
  getRcmcApplication,
  getRcmcMasters,
  getRcmcQuote,
  listRcmcApplications,
  saveRcmcCountries,
  submitRcmcApplication,
  updateRcmcApplication,
  uploadRcmcAttachment,
} from "../../services/rcmcProfileService";
import { useAuth } from "../../context/useAuth";

const steps = [
  "Application & Basic Details",
  "Export Performance",
  "Firm Details",
  "Existing RCMC Details",
  "Branch Details",
  "Bank Details",
  "Industrial Registration",
  "Proprietor / Partner / Director",
  "Status Holder Details",
  "Preferred Sector",
  "RCMC Application Details",
  "EPC / Commodity Board",
  "Certification Details",
  "Export Products / Services",
  "Authorized Representative",
  "Export Countries",
  "Firm Profile & Website",
  "Attachments",
  "Fee & E-Sign",
  "Review & Submit",
];
const empty = {
  basic_details: {
    iec: "",
    pan: "",
    firmName: "",
    incorporationDate: "",
    iecIssuanceDate: "",
    dgftOffice: "",
    nature: "",
    exporterCategory: "",
    cin: "",
    annualTurnover: "",
  },
  firm_details: {
    address1: "",
    address2: "",
    city: "",
    pincode: "",
    district: "",
    state: "",
  },
  status_holder: {
    starRating: "NA",
    certificateNumber: "",
    issuingAuthority: "",
    issueDate: "",
    validityDate: "",
  },
  preferred_sector: { importList: "", exportList: "", anf1Updated: false },
  application_details: {
    epcCode: "GENERAL",
    mainBusiness: "",
    msmeStatus: "NO",
    statusHolder: "NO",
    exporterCategory: "",
    membershipYears: 1,
    financialYear: "",
    annualTurnover: "",
    previousExportPerformance: "",
  },
  epc_details: {
    officeCode: "",
    officeName: "",
    officeAddress: "",
    region: "",
    email: "",
    telephone: "",
    jurisdiction: "",
    branchName: "",
    printAnnexure: "NO",
    gstin: "",
    branchAddress: "",
    branchSez: "NO",
    goodsDescription: "",
  },
  profile_details: { firmProfile: "", website: "" },
  fee_details: {},
  esign_details: {},
};
const repeatMap = {
  2: [
    "performance",
    "Export Performance",
    ["financial_year", "direct_exports", "deemed_exports", "service_exports"],
  ],
  4: [
    "certificates",
    "Existing RCMC",
    [
      "rcmcNumber",
      "issueDate",
      "issueAuthority",
      "products",
      "expiryDate",
      "status",
      "exporterType",
      "validityPeriod",
      "epcStatus",
    ],
  ],
  5: [
    "branches",
    "Branch",
    [
      "name",
      "branchCode",
      "sez",
      "eou",
      "gstin",
      "address1",
      "address2",
      "city",
      "pincode",
      "district",
      "state",
    ],
  ],
  6: [
    "banks",
    "Bank Account",
    [
      "name",
      "accountNumber",
      "accountHolder",
      "ifsc",
      "branchName",
      "pfmsStatus",
      "primary",
    ],
  ],
  7: [
    "registrations",
    "Industrial Registration",
    [
      "name",
      "registrationNumber",
      "issuingAuthority",
      "issueDate",
      "productRegistered",
    ],
  ],
  8: [
    "persons",
    "Person",
    [
      "name",
      "din",
      "foreignNational",
      "address1",
      "address2",
      "city",
      "pincode",
      "district",
      "state",
    ],
  ],
  13: [
    "certifications",
    "Certification",
    ["name", "issueDate", "validityDate"],
  ],
  14: [
    "products",
    "Product / Service",
    ["name", "exporterType", "code", "description"],
  ],
  15: [
    "contacts",
    "Contact Person",
    [
      "name",
      "category",
      "designation",
      "address1",
      "address2",
      "city",
      "pincode",
      "district",
      "state",
      "telephone",
      "mobile",
      "email",
    ],
  ],
};
const titles = {
  basic_details: "Basic Details",
  firm_details: "Firm Details",
  status_holder: "Status Holder",
  preferred_sector: "Preferred Sector",
  application_details: "RCMC Application",
  epc_details: "EPC / Commodity Board",
  profile_details: "Firm Profile",
};
const statusStyle = {
  DRAFT: "bg-slate-100 text-slate-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  UNDER_REVIEW: "bg-indigo-100 text-indigo-700",
  ACTION_REQUIRED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-rose-100 text-rose-700",
  REJECTED: "bg-rose-100 text-rose-700",
};
const pretty = (s) =>
  String(s || "")
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const alert = (icon, title, text) =>
  Swal.fire({ icon, title, text, confirmButtonColor: "#174f92" });
const fieldType = (k) =>
  /date/i.test(k)
    ? "date"
    : /turnover|performance|exports|fee|amount/i.test(k)
      ? "number"
      : /profile|description|address/i.test(k)
        ? "textarea"
        : "text";

export default function RcmcProfile() {
  const { user } = useAuth();
  const [masters, setMasters] = useState(null),
    [apps, setApps] = useState([]),
    [app, setApp] = useState(null),
    [form, setForm] = useState(empty),
    [step, setStep] = useState(1),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false);
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        getRcmcMasters(),
        listRcmcApplications(),
      ]);
      setMasters(m);
      setApps(a.applications || []);
    } catch (e) {
      alert(
        "error",
        "Unable to load RCMC workspace",
        e.response?.data?.message,
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadList();
  }, [loadList]);
  const hydrate = (a) => {
    setApp(a);
    setStep(a.current_step || 1);
    setForm(
      Object.fromEntries(
        Object.keys(empty).map((k) => [k, { ...empty[k], ...(a[k] || {}) }]),
      ),
    );
  };
  const open = async (id) => {
    setLoading(true);
    try {
      hydrate((await getRcmcApplication(id)).application);
    } catch (e) {
      alert(
        "error",
        "Unable to open RCMC application",
        e.response?.data?.message,
      );
    } finally {
      setLoading(false);
    }
  };
  const create = async (type) => {
    setSaving(true);
    try {
      hydrate((await createRcmcApplication(type)).application);
    } catch (e) {
      alert("error", "Unable to create application", e.response?.data?.message);
    } finally {
      setSaving(false);
    }
  };
  const patch = (section, key, value) => {
    if (section === "file_name") {
      setApp((a) => ({ ...a, file_name: value }));
      return;
    }
    setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } }));
  };
  const save = async (nextStep = step, quiet = false) => {
    setSaving(true);
    try {
      const result = await updateRcmcApplication(app.id, {
        ...form,
        file_name: app.file_name,
        current_step: nextStep,
      });
      hydrate(result.application);
      setStep(nextStep);
      if (!quiet)
        alert(
          "success",
          "Draft saved",
          "Your RCMC application can be continued later.",
        );
      return true;
    } catch (e) {
      alert("error", "Save failed", e.response?.data?.message);
      return false;
    } finally {
      setSaving(false);
    }
  };
  const refresh = async () =>
    hydrate((await getRcmcApplication(app.id)).application);
  const submit = async () => {
    await save(20, true);
    const ok = await Swal.fire({
      icon: "question",
      title: "Submit RCMC application?",
      text: "The submitted application becomes read-only.",
      showCancelButton: true,
      confirmButtonText: "Submit",
      confirmButtonColor: "#174f92",
    });
    if (ok.isConfirmed)
      try {
        hydrate((await submitRcmcApplication(app.id)).application);
        alert("success", "RCMC application submitted", app.application_number);
      } catch (e) {
        alert("error", "Submission blocked", e.response?.data?.message);
      }
  };
  if (loading)
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-2 text-slate-500">
        <LoaderCircle className="animate-spin" />
        Loading RCMC workspace…
      </div>
    );
  if (!app)
    return (
      <Dashboard
        applications={apps}
        create={create}
        open={open}
        saving={saving || user?.role !== "ADMIN"}
      />
    );
  const readonly =
    user?.role !== "ADMIN" ||
    !["DRAFT", "ACTION_REQUIRED"].includes(app.status);
  return (
    <div className="dashboard-page">
      <Hero
        app={app}
        back={() => {
          setApp(null);
          loadList();
        }}
      />
      <Stepper step={step} setStep={setStep} />
      <section className="iec-form-card">
        <SectionBody
          step={step}
          app={app}
          form={form}
          patch={patch}
          masters={masters}
          refresh={refresh}
          readonly={readonly}
        />
        <footer className="iec-footer">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ArrowLeft size={16} />
            Previous
          </button>
          <div>
            {!readonly && (
              <button onClick={() => save(step)} disabled={saving}>
                <Save size={16} />
                Save Draft
              </button>
            )}
            {step < 20 ? (
              <button className="primary" onClick={() => readonly ? setStep(step + 1) : save(step + 1, true)}>
                {readonly ? "Next" : "Save & Continue"}
                <ArrowRight size={16} />
              </button>
            ) : (
              !readonly && (
                <button className="primary" onClick={submit}>
                  <Send size={16} />
                  Submit Application
                </button>
              )
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}

function Dashboard({ applications, create, open, saving }) {
  const count = (s) => applications.filter((a) => a.status === s).length;
  return (
    <div className="dashboard-page">
      <section className="workspace-overview-hero p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="workspace-hero-eyebrow">Statutory Profile</span>
            <h1>RCMC Applications</h1>
            <p>
              Registration-cum-Membership Certificate applications, renewals and
              tracking.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="workspace-hero-primary"
              disabled={saving}
              onClick={() => create("NEW")}
            >
              <Plus size={16} />
              New RCMC Application
            </button>
            <button
              className="workspace-hero-secondary"
              disabled={saving}
              onClick={() => create("RENEWAL")}
            >
              Renew RCMC
            </button>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {[
            ["Active", count("ACTIVE")],
            ["Expired", count("EXPIRED")],
            ["Expiring Soon", 0],
            ["Draft", count("DRAFT")],
            ["Submitted", count("SUBMITTED")],
            ["Action Required", count("ACTION_REQUIRED")],
          ].map((x) => (
            <div className="rounded-2xl border bg-white/80 p-3" key={x[0]}>
              <b className="text-xl text-slate-900">{x[1]}</b>
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                {x[0]}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="dashboard-panel overflow-hidden">
        <header className="iec-list-header">
          <div>
            <p className="workspace-hero-eyebrow">Application register</p>
            <h2>RCMC Dashboard</h2>
          </div>
        </header>
        <div className="iec-table-wrap">
          <table className="admin-register-table">
            <thead>
              <tr>
                {[
                  "Application Number",
                  "RCMC Number",
                  "Type",
                  "EPC / Board",
                  "Firm",
                  "Financial Year",
                  "Submitted",
                  "Expiry",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.length ? (
                applications.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <b>{a.application_number}</b>
                    </td>
                    <td>{a.rcmc_number || "Pending"}</td>
                    <td>{pretty(a.application_type)}</td>
                    <td>{a.application_details?.epcCode || "—"}</td>
                    <td>{a.basic_details?.firmName || "Draft"}</td>
                    <td>{a.application_details?.financialYear || "—"}</td>
                    <td>
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleDateString("en-IN")
                        : "—"}
                    </td>
                    <td>{a.expiry_date || "—"}</td>
                    <td>
                      <span className={`iec-status ${statusStyle[a.status]}`}>
                        {pretty(a.status)}
                      </span>
                    </td>
                    <td>
                      <button className="iec-action" onClick={() => open(a.id)}>
                        {a.status === "DRAFT" ? "Continue" : "View"}
                        <ArrowRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="iec-empty">
                    <FileText />
                    <b>No RCMC applications</b>
                    <span>Create a new application or renewal.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
function Hero({ app, back }) {
  return (
    <section className="workspace-overview-hero p-7">
      <button className="iec-back" onClick={back}>
        <ArrowLeft size={14} />
        RCMC Dashboard
      </button>
      <div className="flex items-end justify-between">
        <div>
          <span className="workspace-hero-eyebrow">
            {app.application_number}
          </span>
          <h1>RCMC {pretty(app.application_type)}</h1>
          <p>
            Registration-cum-Membership Certificate · auto-saved draft workflow
          </p>
        </div>
        <span className={`iec-status ${statusStyle[app.status]}`}>
          {pretty(app.status)}
        </span>
      </div>
    </section>
  );
}
function Stepper({ step, setStep }) {
  return (
    <nav className="iec-stepper">
      {steps.map((n, i) => (
        <button
          key={n}
          onClick={() => setStep(i + 1)}
          className={step === i + 1 ? "active" : step > i + 1 ? "done" : ""}
        >
          <span>{step > i + 1 ? <Check size={13} /> : i + 1}</span>
          <b>{n}</b>
        </button>
      ))}
    </nav>
  );
}
function Field({
  caption,
  value,
  onChange,
  options,
  disabled,
  type = "text",
  required = false,
}) {
  return (
    <label className="iec-field">
      <span>
        {caption}
        {required && <i>*</i>}
      </span>
      {options ? (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          {options.map((o) => (
            <option
              key={typeof o === "object" ? o.value : o}
              value={typeof o === "object" ? o.value : o}
            >
              {typeof o === "object" ? o.label : o || "Select"}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength="2000"
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      )}
    </label>
  );
}
function FormSection({ title, subtitle, children }) {
  return (
    <>
      <header className="iec-section-title">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>
      <div className="iec-grid">{children}</div>
    </>
  );
}
function ObjectFields({ section, value, patch, readonly, fields, masters }) {
  return (
    <>
      {fields.map((k) => {
        let options;
        if (["applicationType"].includes(k)) options = ["NEW", "RENEWAL"];
        if (
          ["msmeStatus", "statusHolder", "printAnnexure", "branchSez"].includes(
            k,
          )
        )
          options = ["YES", "NO"];
        if (k === "membershipYears") options = masters.membershipPeriods;
        if (k === "financialYear") options = ["", ...masters.financialYears];
        if (k === "starRating") options = masters.starRatings;
        return (
          <Field
            key={k}
            caption={pretty(k)}
            value={value[k]}
            type={fieldType(k)}
            options={options}
            disabled={readonly}
            onChange={(v) => patch(section, k, v)}
            required={[
              "iec",
              "pan",
              "firmName",
              "epcCode",
              "membershipYears",
            ].includes(k)}
          />
        );
      })}
    </>
  );
}
function SectionBody({ step, app, form, patch, masters, refresh, readonly }) {
  if (repeatMap[step])
    return (
      <Repeatable
        spec={repeatMap[step]}
        app={app}
        refresh={refresh}
        readonly={readonly}
      />
    );
  if (step === 1)
    return (
      <FormSection
        title="Application & Basic Details"
        subtitle="Company and IEC profile values are reused automatically"
      >
        <Field
          caption="Application Number"
          value={app.application_number}
          disabled
        />
        <Field
          caption="File Name"
          value={app.file_name}
          onChange={(v) => patch("file_name", "value", v)}
          disabled={readonly}
        />
        <Field
          caption="Application Type"
          value={app.application_type}
          disabled
        />
        <ObjectFields
          section="basic_details"
          value={form.basic_details}
          patch={patch}
          readonly={readonly}
          fields={Object.keys(empty.basic_details)}
          masters={masters}
        />
      </FormSection>
    );
  if (step === 3)
    return (
      <FormSection
        title="Firm Details"
        subtitle="Verify the registered office sourced from Company Profile"
      >
        <ObjectFields
          section="firm_details"
          value={form.firm_details}
          patch={patch}
          readonly={readonly}
          fields={Object.keys(empty.firm_details)}
          masters={masters}
        />
      </FormSection>
    );
  if (step === 9)
    return (
      <FormSection
        title="Status Holder Details"
        subtitle="DGFT status-holder certificate information"
      >
        <ObjectFields
          section="status_holder"
          value={form.status_holder}
          patch={patch}
          readonly={readonly}
          fields={Object.keys(empty.status_holder)}
          masters={masters}
        />
      </FormSection>
    );
  if (step === 10)
    return (
      <FormSection
        title="Preferred Sectors of Operations"
        subtitle="Select applicable import and export sectors"
      >
        <Field
          caption="Import List"
          value={form.preferred_sector.importList}
          onChange={(v) => patch("preferred_sector", "importList", v)}
          options={["", ...masters.sectors]}
          disabled={readonly}
        />
        <Field
          caption="Export List"
          value={form.preferred_sector.exportList}
          onChange={(v) => patch("preferred_sector", "exportList", v)}
          options={["", ...masters.sectors]}
          disabled={readonly}
        />
        <label className="iec-declaration">
          <input
            type="checkbox"
            checked={!!form.preferred_sector.anf1Updated}
            onChange={(e) =>
              patch("preferred_sector", "anf1Updated", e.target.checked)
            }
            disabled={readonly}
          />
          <span>
            <b>ANF-1 Profile</b>I have updated my profile in ANF-1.
          </span>
        </label>
      </FormSection>
    );
  if (step === 11)
    return (
      <FormSection
        title="RCMC Application Details"
        subtitle="Membership, exporter and financial-year selection"
      >
        <Field
          caption="EPC / Commodity Board"
          value={form.application_details.epcCode}
          onChange={(v) => patch("application_details", "epcCode", v)}
          options={masters.epcs.map((e) => ({ value: e.code, label: e.name }))}
          disabled={readonly}
        />
        <ObjectFields
          section="application_details"
          value={form.application_details}
          patch={patch}
          readonly={readonly}
          fields={Object.keys(empty.application_details).filter(
            (k) => k !== "epcCode",
          )}
          masters={masters}
        />
      </FormSection>
    );
  if (step === 12)
    return (
      <EpcSection
        form={form}
        patch={patch}
        masters={masters}
        readonly={readonly}
      />
    );
  if (step === 16)
    return (
      <Countries
        app={app}
        masters={masters}
        refresh={refresh}
        readonly={readonly}
      />
    );
  if (step === 17)
    return (
      <FormSection
        title="Firm Profile & Website"
        subtitle="Professional company and export-capability profile"
      >
        <ObjectFields
          section="profile_details"
          value={form.profile_details}
          patch={patch}
          readonly={readonly}
          fields={Object.keys(empty.profile_details)}
          masters={masters}
        />
      </FormSection>
    );
  if (step === 18)
    return <Attachments app={app} refresh={refresh} readonly={readonly} />;
  if (step === 19)
    return (
      <Fees
        app={app}
        form={form}
        patch={patch}
        masters={masters}
        readonly={readonly}
      />
    );
  return <Review app={app} form={form} />;
}
function Repeatable({ spec, app, refresh, readonly }) {
  const [type, title, fields] = spec,
    [data, setData] = useState({});
  const list = app[type] || [];
  const add = async () => {
    const first = fields[0],
      name = data.name || data[first];
    if (!name)
      return alert(
        "warning",
        `${pretty(first)} required`,
        "Complete the first field before adding this record.",
      );
    const payload =
      type === "performance"
        ? data
        : type === "certificates"
          ? { details: data }
          : { name, details: data };
    try {
      await addRcmcRecord(app.id, type, payload);
      setData({});
      await refresh();
    } catch (e) {
      alert("error", "Unable to add record", e.response?.data?.message);
    }
  };
  return (
    <>
      <FormSection
        title={`${title} Details`}
        subtitle={`Add and manage multiple ${title.toLowerCase()} records`}
      >
        {fields.map((k) => (
          <Field
            key={k}
            caption={pretty(k)}
            value={data[k]}
            onChange={(v) => setData((x) => ({ ...x, [k]: v }))}
            type={fieldType(k)}
            disabled={readonly}
          />
        ))}
      </FormSection>
      {!readonly && (
        <button className="workspace-hero-primary mt-4" onClick={add}>
          <Plus size={15} />
          Add {title}
        </button>
      )}
      <div className="iec-summary-grid mt-5">
        {list.map((x) => {
          const values = type === "performance" ? x : x.details || {};
          return (
            <article key={x.id}>
              <div>
                <b>
                  {x.name || x.financial_year || values.rcmcNumber || title}
                </b>
                <span>
                  {Object.entries(values)
                    .slice(0, 4)
                    .map(([k, v]) => `${pretty(k)}: ${v || "—"}`)
                    .join(" · ")}
                </span>
                {type === "performance" && (
                  <span>
                    Total: ₹
                    {(
                      Number(x.direct_exports) +
                      Number(x.deemed_exports) +
                      Number(x.service_exports)
                    ).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
              {!readonly && (
                <button
                  className="danger"
                  onClick={async () => {
                    await deleteRcmcRecord(app.id, type, x.id);
                    refresh();
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
function EpcSection({ form, patch, masters, readonly }) {
  const epc =
      masters.epcs.find((e) => e.code === form.application_details.epcCode) ||
      masters.epcs[0],
    office = epc?.offices.find((o) => o.code === form.epc_details.officeCode);
  useEffect(() => {
    if (office) {
      for (const k of [
        "name",
        "address",
        "region",
        "email",
        "telephone",
        "jurisdiction",
      ])
        patch(
          "epc_details",
          k === "name" ? "officeName" : k === "address" ? "officeAddress" : k,
          office[k] || "",
        );
    }
  }, [office]);
  return (
    <FormSection
      title="EPC / Commodity Board Details"
      subtitle="Office metadata is populated from master data"
    >
      <Field
        caption="Office for Submission"
        value={form.epc_details.officeCode}
        onChange={(v) => patch("epc_details", "officeCode", v)}
        options={[
          "",
          ...(epc?.offices || []).map((o) => ({
            value: o.code,
            label: o.name,
          })),
        ]}
        disabled={readonly}
      />
      <ObjectFields
        section="epc_details"
        value={form.epc_details}
        patch={patch}
        readonly={readonly}
        fields={Object.keys(empty.epc_details).filter(
          (k) => k !== "officeCode",
        )}
        masters={masters}
      />
    </FormSection>
  );
}
function Countries({ app, masters, refresh, readonly }) {
  const selected = new Set((app.countries || []).map((c) => c.country_code));
  return (
    <>
      <FormSection
        title="Export Countries"
        subtitle="Select every country to which the company exports"
      >
        {masters.countries.map((c) => (
          <label className="iec-declaration" key={c.code}>
            <input
              type="checkbox"
              checked={selected.has(c.code)}
              disabled={readonly}
              onChange={async (e) => {
                const next = masters.countries.filter((x) =>
                  e.target.checked
                    ? selected.has(x.code) || x.code === c.code
                    : selected.has(x.code) && x.code !== c.code,
                );
                await saveRcmcCountries(app.id, next);
                refresh();
              }}
            />
            <span>
              <b>{c.name}</b>
              {c.code}
            </span>
          </label>
        ))}
      </FormSection>
    </>
  );
}
function Attachments({ app, refresh, readonly }) {
  const [type, setType] = useState("RCMC Supporting Document"),
    [remark, setRemark] = useState("");
  return (
    <>
      <FormSection
        title="Attachment Details"
        subtitle="PDF, JPG or PNG files up to 15 MB"
      >
        <Field
          caption="Attachment Type"
          value={type}
          onChange={setType}
          options={[
            "RCMC Supporting Document",
            "IEC Certificate",
            "GST Certificate",
            "CA Certificate",
            "MSME / UDYAM Certificate",
            "Export Certificate",
            "Product Certificate",
            "Other",
          ]}
          disabled={readonly}
        />
        <Field
          caption="Remark"
          value={remark}
          onChange={setRemark}
          disabled={readonly}
        />
        <label className="iec-upload">
          <Upload />
          <span>Choose attachment</span>
          <input
            type="file"
            disabled={readonly}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const data = new FormData();
              data.append("file", f);
              data.append("attachmentType", type);
              data.append("remark", remark);
              await uploadRcmcAttachment(app.id, data);
              setRemark("");
              refresh();
            }}
          />
        </label>
      </FormSection>
      <div className="iec-documents mt-5">
        {app.attachments.map((x) => (
          <div key={x.id}>
            <FileText />
            <span>
              {x.original_name}
              <small>
                {x.attachment_type} · {x.remark}
              </small>
            </span>
            <button onClick={() => downloadRcmcAttachment(app.id, x)}>
              <Download size={14} />
            </button>
            {!readonly && (
              <button
                onClick={async () => {
                  await deleteRcmcAttachment(app.id, x.id);
                  refresh();
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
function Fees({ app, form, patch, readonly }) {
  const calculate = async () => {
    try {
      const x = (
        await getRcmcQuote(app.id, {
          epcCode: form.application_details.epcCode,
          membershipYears: form.application_details.membershipYears,
          sameState: form.firm_details.state?.toLowerCase() === "maharashtra",
        })
      ).quote;
      patch("fee_details", "baseFee", x.baseFee);
      patch("fee_details", "gstRate", x.gstRate);
      patch("fee_details", "cgst", x.cgst);
      patch("fee_details", "sgst", x.sgst);
      patch("fee_details", "igst", x.igst);
      patch("fee_details", "total", x.total);
    } catch (e) {
      alert("error", "Fee unavailable", e.response?.data?.message);
    }
  };
  return (
    <>
      <FormSection
        title="Fee Details"
        subtitle="Fee and GST come from backend configuration"
      >
        <div className="col-span-full">
          <button
            className="workspace-hero-primary"
            onClick={calculate}
            disabled={readonly}
          >
            Calculate Fee
          </button>
        </div>
        {Object.entries(form.fee_details).map(([k, v]) => (
          <Field key={k} caption={pretty(k)} value={v} disabled />
        ))}
      </FormSection>
      <FormSection
        title="DSC / E-Sign Details"
        subtitle="Certificate metadata will populate from the signing process"
      >
        <p className="col-span-full text-sm text-slate-500">
          No signing certificate has been attached to this draft.
        </p>
      </FormSection>
    </>
  );
}
function Review({ app, form }) {
  const sections = [
    ...Object.entries(form).filter(
      ([k]) => !["fee_details", "esign_details"].includes(k),
    ),
    ["fee_details", form.fee_details],
  ];
  return (
    <>
      <header className="iec-section-title">
        <h2>Review & Submit</h2>
        <p>Verify every section. No declaration or undertaking is included.</p>
      </header>
      <div className="iec-review">
        {sections.map(([k, v]) => (
          <article key={k}>
            <header>
              <h3>{titles[k] || pretty(k)}</h3>
            </header>
            <dl>
              {Object.entries(v || {}).map(([a, b]) => (
                <div key={a}>
                  <dt>{pretty(a)}</dt>
                  <dd>
                    {typeof b === "boolean" ? (b ? "Yes" : "No") : b || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        {Object.keys(repeatMap).map((s) => {
          const [key, title] = repeatMap[s];
          return (
            <article key={key}>
              <header>
                <h3>{title}</h3>
              </header>
              <p>{(app[key] || []).length} saved record(s)</p>
            </article>
          );
        })}
        <article>
          <header>
            <h3>Attachments</h3>
          </header>
          <p>{app.attachments.length} uploaded file(s)</p>
        </article>
      </div>
    </>
  );
}
