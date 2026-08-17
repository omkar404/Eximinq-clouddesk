import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileUp,
  GitBranch,
  Info,
  KeyRound,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRound
} from "lucide-react";
import API from "../../services/interceptor";
import {
  openClientCompanyProfileDocument,
  removeTempCompanyDocument,
  uploadCompanyDocument
} from "../../services/documentService";
import { useAuth } from "../../context/useAuth";
import {
  CLIENT_COMPANY_DOCUMENT_FIELDS,
  COMPANY_TYPE_OPTIONS,
  EXPORTER_CATEGORY_OPTIONS,
  KEY_PERSON_TITLE_OPTIONS,
  PORTAL_NAME_OPTIONS,
  UDHYAM_STATUS_OPTIONS,
  YES_NO_OPTIONS
} from "../../constants/companyProfile";

const LOCAL_DRAFT_KEY = "client-company-profile-draft-v2";

const STEP_DEFINITIONS = [
  {
    key: "company-profile",
    title: "Company Profile",
    description: "Capture the firm identity, core registrations, and GSTIN records.",
    icon: Building2
  },
  {
    key: "branch-details",
    title: "Branch Details",
    description: "Map branch-level details to the GSTINs already captured above.",
    icon: GitBranch
  },
  {
    key: "key-person-details",
    title: "Key Person Details",
    description: "Record the core people responsible for the company profile.",
    icon: UserRound
  },
  {
    key: "authorised-signatory-details",
    title: "Authorised Signatory Details",
    description: "Capture the active PAN and Aadhaar holders for filings.",
    icon: ShieldCheck
  },
  {
    key: "portal-credentials",
    title: "Portal Credentials",
    description: "Save portal access details needed for recurring portal use.",
    icon: KeyRound
  }
];

const COMPANY_PROFILE_SUBSTEPS = [
  {
    key: "active-section",
    title: "Active Section"
  },
  {
    key: "gstin-details",
    title: "GSTIN Details"
  },
  {
    key: "supporting-details",
    title: "Supporting Details"
  },
  {
    key: "company-documents",
    title: "Company Documents"
  }
];

const QUICK_FORM_SECTIONS = [
  {
    key: "company",
    title: "Company Details",
    icon: Building2
  },
  {
    key: "documents",
    title: "Documents & IDs",
    icon: FileUp
  },
  {
    key: "people",
    title: "Key People",
    icon: UserRound
  },
  {
    key: "portals",
    title: "Portal Access",
    icon: KeyRound
  }
];

const FormInteractivityContext = createContext({ readOnly: false });

function emptyGstin(index = 0) {
  return {
    id: `gstin-${index + 1}`,
    label: `GSTIN ${index + 1}`,
    gstin: "",
    documentPath: "",
    branchAddresses: [emptyBranchAddress(0)]
  };
}

function emptyBranchAddress(index = 0) {
  return {
    id: `branch-address-${index + 1}`,
    branchName: "",
    address: "",
    city: "",
    district: "",
    pinCode: ""
  };
}

function emptyBranch(index = 0) {
  return {
    id: `branch-${index + 1}`,
    gstin: "",
    branchNumber: String(index + 1),
    branchCode: "",
    isSez: "NO",
    isEou: "NO",
    state: "",
    address: "",
    city: "",
    pinCode: "",
    district: "",
    branchName: "",
    branchAddresses: [emptyBranchAddress(0)]
  };
}

function emptyKeyPerson(index = 0) {
  return {
    id: `key-person-${index + 1}`,
    serialNumber: String(index + 1),
    title: "Mr",
    isForeignDirector: "NO",
    passportNumber: "",
    directorName: "",
    fatherName: "",
    designation: "",
    din: "",
    dateOfBirth: "",
    mobileNumber: "",
    address: "",
    city: "",
    pinCode: "",
    district: "",
    state: "",
    panCardNo: "",
    aadharCardNo: "",
    panDocumentPath: "",
    aadharDocumentPath: ""
  };
}

function emptyAuthorisedSignatory(index = 0) {
  return {
    id: `authorised-signatory-${index + 1}`,
    panName: "",
    panCardNo: "",
    mobileNumber: "",
    panDocumentPath: "",
    aadharName: "",
    aadharCardNo: "",
    aadharDocumentPath: ""
  };
}

function emptyPortal(index = 0) {
  return {
    id: `portal-${index + 1}`,
    portalName:
      PORTAL_NAME_OPTIONS[Math.min(index, PORTAL_NAME_OPTIONS.length - 1)] || "",
    userId: "",
    password: "",
    website: "",
    lastLogin: ""
  };
}

function normalizeProfile(data) {
  const source = data?.profile || {};

  return {
    cdcrNo: data?.user?.userCode || source.user_code || "",
    companyName: source.company_name || "",
    companyType: source.company_type || source.concern_nature || "",
    concernNature: source.concern_nature || source.company_type || "",
    businessType: source.business_type || "",
    exporterImporterCategory: source.exporter_importer_category || "",
    headOfficeAddress: source.head_office_address || "",
    firmMobileNo: source.firm_mobile_no || "",
    firmEmail: source.correspondence_email || data?.user?.email || "",
    panNumber: source.pan_number || "",
    panDocumentPath: source.pan_document_path || "",
    iecNumber: source.iec_number || "",
    iecIssuedAt: source.iec_issued_at || "",
    iecDocumentPath: source.iec_document_path || "",
    gstFilingStatus: source.gst_filing_status || "",
    gstinDetails:
      source.gstin_details?.length > 0
        ? source.gstin_details.map((item, index) => ({
            id: item.id || `gstin-${index + 1}`,
            label: item.label || `GSTIN ${index + 1}`,
            gstin: item.gstin || "",
            documentPath: item.documentPath || item.document_path || "",
            branchAddresses:
              item.branchAddresses?.length > 0
                ? item.branchAddresses.map((addressItem, addressIndex) => ({
                    ...emptyBranchAddress(addressIndex),
                    ...addressItem
                  }))
                : [emptyBranchAddress(0)]
          }))
        : [emptyGstin(0)],
    dateOfIncorporation: source.date_of_incorporation || "",
    incorporationCertificateNo: source.incorporation_certificate_no || "",
    incorporationDocumentPath: source.incorporation_document_path || "",
    udhyamCertificateNo: source.udhyam_certificate_no || "",
    udhyamStatus: source.udhyam_status || "",
    udhyamDocumentPath: source.udhyam_document_path || "",
    rcmcNumber: source.rcmc_number || "",
    rcmcValidUntil: source.rcmc_valid_until || "",
    rcmcDocumentPath: source.rcmc_document_path || "",
    shopEstablishmentDocumentPath:
      source.shop_establishment_document_path || "",
    shopEstablishmentNumber: source.shop_establishment_number || "",
    partnershipDeedDocumentPath:
      source.partnership_deed_document_path || "",
    partnershipDeedNumber: source.partnership_deed_number || "",
    isSez:
      source.is_sez === true ? "YES" : source.is_sez === false ? "NO" : "NO",
    branches:
      source.branches?.length > 0
        ? source.branches.map((item, index) => ({
            ...emptyBranch(index),
            ...item,
            isSez: item.isSez ? "YES" : "NO",
            isEou: item.isEou ? "YES" : "NO",
            gstin: item.gstin || item.gst || "",
            branchAddresses:
              item.branchAddresses?.length > 0
                ? item.branchAddresses.map((addressItem, addressIndex) => ({
                    ...emptyBranchAddress(addressIndex),
                    ...addressItem
                  }))
                : [
                    {
                      ...emptyBranchAddress(0),
                      branchName: item.branchName || "",
                      address: item.address || "",
                      city: item.city || "",
                      district: item.district || "",
                      pinCode: item.pinCode || ""
                    }
                  ]
          }))
        : [emptyBranch(0)],
    keyPeople:
      source.key_people?.length > 0
        ? source.key_people.map((item, index) => ({
            ...emptyKeyPerson(index),
            ...item,
            isForeignDirector: item.isForeignDirector ? "YES" : "NO"
          }))
        : [emptyKeyPerson(0)],
    authorisedSignatories:
      source.authorised_signatories?.length > 0
        ? source.authorised_signatories.map((item, index) => ({
            ...emptyAuthorisedSignatory(index),
            ...item
          }))
        : [emptyAuthorisedSignatory(0)],
    dscInfo: {
      holderName: source.dsc_info?.holderName || "",
      expiryDate: source.dsc_info?.expiryDate || ""
    },
    portalCredentials:
      source.portal_credentials?.length > 0
        ? source.portal_credentials.map((item, index) => ({
            ...emptyPortal(index),
            ...item
          }))
        : [emptyPortal(0), emptyPortal(1)]
  };
}

function mergeDraftIntoProfile(baseProfile, draftProfile) {
  if (!draftProfile) {
    return baseProfile;
  }

  return {
    ...baseProfile,
    ...draftProfile,
    gstinDetails:
      draftProfile.gstinDetails?.length > 0
        ? draftProfile.gstinDetails
        : baseProfile.gstinDetails,
    branches:
      draftProfile.branches?.length > 0
        ? draftProfile.branches
        : baseProfile.branches,
    keyPeople:
      draftProfile.keyPeople?.length > 0
        ? draftProfile.keyPeople
        : baseProfile.keyPeople,
    authorisedSignatories:
      draftProfile.authorisedSignatories?.length > 0
        ? draftProfile.authorisedSignatories
        : baseProfile.authorisedSignatories,
    portalCredentials:
      draftProfile.portalCredentials?.length > 0
        ? draftProfile.portalCredentials
        : baseProfile.portalCredentials,
    dscInfo: {
      ...baseProfile.dscInfo,
      ...(draftProfile.dscInfo || {})
    }
  };
}

function readDraft() {
  try {
    const raw = window.localStorage.getItem(LOCAL_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDraft(form) {
  try {
    window.localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(form));
  } catch {
    // Ignore storage limitations and continue with in-memory state.
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(LOCAL_DRAFT_KEY);
  } catch {
    // Ignore storage limitations and continue with in-memory state.
  }
}

function ensureSetupRouteDefaults(profile) {
  const nextPortalCredentials = [...(profile.portalCredentials || [])];

  if (!nextPortalCredentials[0]) {
    nextPortalCredentials[0] = emptyPortal(0);
  }
  nextPortalCredentials[0] = {
    ...emptyPortal(0),
    ...nextPortalCredentials[0],
    portalName: PORTAL_NAME_OPTIONS[0]
  };

  if (!nextPortalCredentials[1]) {
    nextPortalCredentials[1] = emptyPortal(1);
  }
  nextPortalCredentials[1] = {
    ...emptyPortal(1),
    ...nextPortalCredentials[1],
    portalName: PORTAL_NAME_OPTIONS[1]
  };

  return {
    ...profile,
    gstinDetails:
      profile.gstinDetails?.length > 0 ? profile.gstinDetails : [emptyGstin(0)],
    keyPeople:
      profile.keyPeople?.length > 0 ? profile.keyPeople : [emptyKeyPerson(0)],
    portalCredentials: nextPortalCredentials
  };
}

function getSetupRouteValidationMessage(form) {
  if (
    !form.companyName.trim() ||
    !form.concernNature.trim() ||
    !form.exporterImporterCategory.trim() ||
    !form.firmMobileNo.trim() ||
    !form.firmEmail.trim()
  ) {
    return "Complete the company details section before submitting.";
  }

  const hasCompleteKeyPerson = form.keyPeople.some(
    person =>
      person.directorName.trim() &&
      person.designation.trim()
  );

  if (!hasCompleteKeyPerson) {
    return "Add at least one key person with name and designation.";
  }

  const mandatoryPortals = [form.portalCredentials[0], form.portalCredentials[1]];
  const missingMandatoryPortal = mandatoryPortals.some(
    portal => !portal?.userId?.trim() || !portal?.password?.trim()
  );

  if (missingMandatoryPortal) {
    return "Enter the User ID and Password for both mandatory portals before submitting.";
  }

  const hasIncompleteAdditionalPortal = (form.portalCredentials || [])
    .slice(2)
    .some(
      portal =>
        [portal.portalName, portal.userId, portal.password].some(value => value?.trim()) &&
        (!portal.portalName.trim() || !portal.userId.trim() || !portal.password.trim())
    );

  if (hasIncompleteAdditionalPortal) {
    return "Complete every additional portal credential row or remove the unfinished one.";
  }

  return "";
}

function buildSectionProgress(form) {
  return {
    "company-profile": [
      form.companyName,
      form.concernNature,
      form.headOfficeAddress,
      form.panNumber,
      form.iecNumber,
      form.gstinDetails[0]?.gstin
    ].filter(Boolean).length,
    "branch-details": form.branches.filter(
      item =>
        item.gstin ||
        item.state ||
        item.branchAddresses?.some(addressItem => addressItem.branchName || addressItem.address)
    ).length,
    "key-person-details": form.keyPeople.filter(
      item => item.directorName || item.designation || item.mobileNumber
    ).length,
    "authorised-signatory-details": form.authorisedSignatories.filter(
      item => item.panName || item.panCardNo || item.mobileNumber
    ).length,
    "portal-credentials": form.portalCredentials.filter(
      item => item.portalName || item.userId || item.password
    ).length
  };
}

function getStepValidationMessage(form, stepKey) {
  if (stepKey === "company-profile") {
    if (!form.companyName || !form.concernNature || !form.panNumber || !form.iecNumber) {
      return "Complete the company profile essentials before moving to Branch Details.";
    }
    if (!form.gstinDetails.some(item => item.gstin.trim())) {
      return "Add at least one GSTIN in the Company Profile step before continuing.";
    }
  }

  if (stepKey === "branch-details") {
    const hasBranch = form.branches.some(
      item => {
        const linkedGstin = form.gstinDetails.find(gstinItem => gstinItem.gstin === item.gstin);
        const linkedAddresses = linkedGstin?.branchAddresses || [];

        return (
          item.gstin.trim() &&
          linkedAddresses.some(
            addressItem => addressItem.branchName.trim() && addressItem.address.trim()
          )
        );
      }
    );
    if (!hasBranch) {
      return "Select at least one GSTIN that already has branch addresses before moving to Key Person Details.";
    }
  }

  if (stepKey === "key-person-details") {
    const hasKeyPerson = form.keyPeople.some(
      item =>
        item.directorName.trim() &&
        item.mobileNumber.trim() &&
        item.panCardNo.trim() &&
        item.aadharCardNo.trim()
    );
    if (!hasKeyPerson) {
      return "Complete at least one key person record with name, mobile number, PAN number, and Aadhaar number before continuing.";
    }
  }

  if (stepKey === "authorised-signatory-details") {
    const hasSignatory = form.authorisedSignatories.some(
      item =>
        item.panName.trim() &&
        item.mobileNumber.trim() &&
        item.panCardNo.trim() &&
        item.aadharCardNo.trim()
    );
    if (!hasSignatory) {
      return "Complete at least one authorised signatory record with mobile number, PAN number, and Aadhaar number before continuing.";
    }
  }

  return "";
}

function DocumentField({
  label,
  helper,
  value,
  savedDocumentUrl,
  fieldKey,
  documentType,
  accept,
  pendingDocuments,
  onUpload,
  uploading,
  onRemove,
  onViewSavedFile,
  readOnly = false
}) {
  const { readOnly: contextReadOnly } = useContext(FormInteractivityContext);
  const isReadOnly = readOnly || contextReadOnly;
  const pendingFile = pendingDocuments[fieldKey];
  const previewUrl = pendingFile?.previewUrl || null;
  const previewMimeType = pendingFile?.mimeType || "";
  const isPdfPreview = previewUrl && previewMimeType.includes("pdf");
  const isImagePreview = previewUrl && previewMimeType.startsWith("image/");

  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>
      <input
        type="file"
        accept={accept}
        aria-label={label}
        disabled={uploading || isReadOnly}
        onChange={async event => {
          const file = event.target.files?.[0];
          if (!file) return;

          await onUpload({ fieldKey, documentType, file });
          event.target.value = "";
        }}
        className="mt-4 w-full text-sm text-slate-600 file:mr-4 file:rounded-2xl file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold"
      />
      <p className="mt-3 text-xs text-slate-500">
        {uploading
          ? "Uploading and validating document..."
          : pendingFile?.fileName
            ? `Uploaded: ${pendingFile.fileName}`
            : value
              ? "Saved file available."
              : `Placeholder: upload ${label.toLowerCase()}.`}
      </p>
      {previewUrl ? (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Document Preview
            </p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#101eb9]"
            >
              Open full file
            </a>
          </div>
          {isPdfPreview ? (
            <iframe
              title={`${label} preview`}
              src={previewUrl}
              className="h-72 w-full bg-slate-100"
            />
          ) : null}
          {isImagePreview ? (
            <img
              src={previewUrl}
              alt={`${label} preview`}
              className="h-72 w-full object-contain bg-slate-100"
            />
          ) : null}
          {!isPdfPreview && !isImagePreview ? (
            <div className="px-4 py-6 text-sm text-slate-500">
              Preview is not available for this file type, but the uploaded file can still be opened.
            </div>
          ) : null}
        </div>
      ) : null}
      {(pendingFile?.token || value) && !uploading ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {pendingFile?.token && !isReadOnly ? (
            <button
              type="button"
              onClick={() => onRemove?.({ fieldKey, documentType })}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600"
            >
              <Trash2 size={15} />
              Remove Uploaded File
            </button>
          ) : null}
          {value && savedDocumentUrl ? (
            <button
              type="button"
              onClick={() => onViewSavedFile?.(savedDocumentUrl)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <FileUp size={15} />
              View Saved File
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  readOnly = false,
  infoText = ""
}) {
  const { readOnly: contextReadOnly } = useContext(FormInteractivityContext);
  const isReadOnly = readOnly || contextReadOnly;

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        <span>{label}</span>
        {isReadOnly && infoText ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold normal-case tracking-normal text-blue-700"
            title={infoText}
          >
            <Info size={12} />
            Read only
          </span>
        ) : null}
      </span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={isReadOnly}
        title={isReadOnly && infoText ? infoText : undefined}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
          isReadOnly
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 focus:border-[#101eb9] focus:shadow-[0_0_0_4px_rgba(16,30,185,0.08)]"
        }`}
      />
      {isReadOnly && infoText ? (
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0 text-blue-600" />
          <span>{infoText}</span>
        </p>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  placeholder,
  value,
  onChange,
  options,
  className = "",
  disabled = false
}) {
  const { readOnly: contextReadOnly } = useContext(FormInteractivityContext);
  const isDisabled = disabled || contextReadOnly;

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
          isDisabled
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 focus:border-[#101eb9] focus:shadow-[0_0_0_4px_rgba(16,30,185,0.08)]"
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextareaField({
  label,
  placeholder,
  value,
  onChange,
  className = "",
  readOnly = false
}) {
  const { readOnly: contextReadOnly } = useContext(FormInteractivityContext);
  const isReadOnly = readOnly || contextReadOnly;

  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </span>
      <textarea
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={isReadOnly}
        className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition ${
          isReadOnly
            ? "border-slate-200 bg-slate-100 text-slate-500"
            : "border-slate-200 bg-white text-slate-700 focus:border-[#101eb9] focus:shadow-[0_0_0_4px_rgba(16,30,185,0.08)]"
        }`}
      />
    </label>
  );
}

function StepBadge({ index, step, isActive, isComplete, onClick }) {
  const Icon = step.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[28px] border p-4 text-left transition ${
        isActive
          ? "border-[#101eb9] bg-[linear-gradient(135deg,#0f1ea4_0%,#101eb9_60%,#2338d9_100%)] text-white shadow-[0_20px_45px_rgba(16,30,185,0.26)]"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${
            isActive ? "bg-white/18" : "bg-slate-100 text-slate-600"
          }`}
        >
          {isComplete && !isActive ? <CheckCircle2 size={18} /> : <Icon size={18} />}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
            isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          0{index + 1}
        </span>
      </div>
      <h3 className="mt-4 text-base font-bold leading-tight">{step.title}</h3>
      <p className={`mt-2 text-sm leading-6 ${isActive ? "text-blue-100" : "text-slate-500"}`}>
        {step.description}
      </p>
      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]">
        <span className={isActive ? "text-white/85" : "text-slate-400"}>
          {isComplete ? "Ready" : "In Progress"}
        </span>
        <span className={isActive ? "text-white/45" : "text-slate-300"}>•</span>
        <span className={isActive ? "text-white/85" : "text-slate-400"}>Section</span>
      </div>
    </button>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{value || "-"}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="flex items-start gap-4 rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fbfcff_0%,#ffffff_100%)] p-5 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-[#eef3ff] text-[#101eb9]">
        {Icon ? <Icon size={24} /> : <Building2 size={24} />}
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
          Active Section
        </p>
        <h2 className="mt-2 text-[1.7rem] font-black tracking-[-0.05em] text-slate-900">
          {title}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function ClientCompanyProfile() {
  const location = useLocation();
  const { user, onboarding, updateOnboarding } = useAuth();
  const [form, setForm] = useState(() => normalizeProfile({}));
  const [documentCatalog, setDocumentCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState({});
  const [uploadingFields, setUploadingFields] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [companyProfileSubStep, setCompanyProfileSubStep] = useState(0);
  const [quickFormSectionIndex, setQuickFormSectionIndex] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await API.get("/auth/company-profile");
        const normalized = ensureSetupRouteDefaults(
          normalizeProfile({ ...response.data, user })
        );
        const draft = readDraft();
        const canEditProfile = response.data.onboarding?.companyProfileEditable !== false;
        const mergedProfile = canEditProfile
          ? ensureSetupRouteDefaults(mergeDraftIntoProfile(normalized, draft))
          : normalized;
        setForm(mergedProfile);
        setDocumentCatalog(response.data.documentCatalog || []);
        if (!canEditProfile) {
          clearDraft();
        }
        updateOnboarding(response.data.onboarding || null);
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Unable to load company profile",
          text: err.response?.data?.message || "Please try again shortly.",
          confirmButtonColor: "#101eb9"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [updateOnboarding, user]);

  useEffect(() => {
    if (!loading) {
      if (onboarding?.companyProfileEditable === false) {
        clearDraft();
      } else {
        writeDraft(form);
      }
    }
  }, [form, loading, onboarding]);

  const sectionProgress = useMemo(() => buildSectionProgress(form), [form]);

  const completedSteps = useMemo(
    () =>
      STEP_DEFINITIONS.filter(step => {
        if (step.key === "company-profile") {
          return sectionProgress[step.key] >= 6;
        }
        return sectionProgress[step.key] > 0;
      }).length,
    [sectionProgress]
  );

  const completedStepState = useMemo(
    () =>
      Object.fromEntries(
        STEP_DEFINITIONS.map(step => [
          step.key,
          step.key === "company-profile"
            ? sectionProgress[step.key] >= 6
            : sectionProgress[step.key] > 0
        ])
      ),
    [sectionProgress]
  );

  const gstinOptions = useMemo(
    () => form.gstinDetails.map(item => item.gstin).filter(Boolean),
    [form.gstinDetails]
  );

  const activeStepConfig = STEP_DEFINITIONS[activeStep];
  const activeCompanyProfileSubStep = COMPANY_PROFILE_SUBSTEPS[companyProfileSubStep];
  const activeQuickFormSection = QUICK_FORM_SECTIONS[quickFormSectionIndex];
  const isSetupRoute = location.pathname === "/client/company-profile-setup";
  const isEditable = isSetupRoute
    ? onboarding?.companyProfileEditable !== false
    : false;
  const approvalStatus = onboarding?.profileApprovalStatus || "draft";
  const hasUploadingInProgress = Object.values(uploadingFields).some(Boolean);
  const savedDocumentUrls = useMemo(
    () =>
      Object.fromEntries((documentCatalog || []).map(item => [item.key, item.download_url])),
    [documentCatalog]
  );

  const revokePreviewUrl = previewUrl => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
  };

  const updateField = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const updateListItem = (listName, index, field, value) => {
    setForm(prev => ({
      ...prev,
      [listName]: prev[listName].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addListItem = (listName, factory) => {
    setForm(prev => ({
      ...prev,
      [listName]: [...prev[listName], factory(prev[listName].length)]
    }));
  };

  const removeListItem = (listName, index) => {
    setForm(prev => ({
      ...prev,
      [listName]:
        prev[listName].length === 1
          ? prev[listName]
          : prev[listName].filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  const moveToStep = nextStep => {
    if (nextStep <= activeStep) {
      setActiveStep(nextStep);
      return;
    }

    const validationMessage = getStepValidationMessage(form, activeStepConfig.key);
    if (validationMessage) {
      Swal.fire({
        icon: "info",
        title: "Finish this section first",
        text: validationMessage,
        confirmButtonColor: "#101eb9"
      });
      return;
    }

    setActiveStep(nextStep);
  };

  const moveCompanyProfileSubStep = nextSubStep => {
    if (nextSubStep < 0 || nextSubStep >= COMPANY_PROFILE_SUBSTEPS.length) {
      return;
    }

    setCompanyProfileSubStep(nextSubStep);
  };

  const updateGstinBranchAddressItem = (gstinIndex, addressIndex, field, value) => {
    setForm(prev => ({
      ...prev,
      gstinDetails: prev.gstinDetails.map((gstinItem, currentGstinIndex) => {
        if (currentGstinIndex !== gstinIndex) {
          return gstinItem;
        }

        return {
          ...gstinItem,
          branchAddresses: (gstinItem.branchAddresses || []).map(
            (addressItem, currentAddressIndex) =>
              currentAddressIndex === addressIndex
                ? { ...addressItem, [field]: value }
                : addressItem
          )
        };
      })
    }));
  };

  const addGstinBranchAddress = gstinIndex => {
    setForm(prev => ({
      ...prev,
      gstinDetails: prev.gstinDetails.map((gstinItem, currentGstinIndex) =>
        currentGstinIndex === gstinIndex
          ? {
              ...gstinItem,
              branchAddresses: [
                ...(gstinItem.branchAddresses || []),
                emptyBranchAddress((gstinItem.branchAddresses || []).length)
              ]
            }
          : gstinItem
      )
    }));
  };

  const removeGstinBranchAddress = (gstinIndex, addressIndex) => {
    setForm(prev => ({
      ...prev,
      gstinDetails: prev.gstinDetails.map((gstinItem, currentGstinIndex) => {
        if (currentGstinIndex !== gstinIndex) {
          return gstinItem;
        }

        return {
          ...gstinItem,
          branchAddresses:
            (gstinItem.branchAddresses || []).length === 1
              ? gstinItem.branchAddresses
              : gstinItem.branchAddresses.filter(
                  (_, currentAddressIndex) => currentAddressIndex !== addressIndex
                )
        };
      })
    }));
  };

  const getAvailableGstinOptions = currentBranchIndex => {
    const selectedByOtherBranches = form.branches
      .filter((_, index) => index !== currentBranchIndex)
      .map(branch => branch.gstin)
      .filter(Boolean);

    const currentSelection = form.branches[currentBranchIndex]?.gstin || "";

    return gstinOptions.filter(
      gstin => gstin === currentSelection || !selectedByOtherBranches.includes(gstin)
    );
  };

  const getLinkedGstinRecord = gstinValue =>
    form.gstinDetails.find(gstinItem => gstinItem.gstin === gstinValue) || null;

  const getLinkedBranchAddresses = gstinValue =>
    getLinkedGstinRecord(gstinValue)?.branchAddresses || [];

  const handleBranchGstinChange = (branchIndex, nextGstin) => {
    const linkedAddresses = getLinkedBranchAddresses(nextGstin);
    const primaryAddress = linkedAddresses[0] || {};

    setForm(prev => ({
      ...prev,
      branches: prev.branches.map((branch, currentBranchIndex) =>
        currentBranchIndex === branchIndex
          ? {
              ...branch,
              gstin: nextGstin,
              branchAddresses: linkedAddresses.map((addressItem, addressIndex) => ({
                ...emptyBranchAddress(addressIndex),
                ...addressItem
              })),
              branchName: primaryAddress.branchName || "",
              address: primaryAddress.address || "",
              city: primaryAddress.city || "",
              district: primaryAddress.district || "",
              pinCode: primaryAddress.pinCode || ""
            }
          : branch
      )
    }));
  };

  const handleDocumentUpload = async ({ fieldKey, documentType, file }) => {
    const previousPendingFile = pendingDocuments[fieldKey];

    try {
      setUploadingFields(prev => ({ ...prev, [fieldKey]: true }));
      const response = await uploadCompanyDocument(documentType, file, fieldKey);
      const previewUrl = window.URL.createObjectURL(file);

      if (previousPendingFile?.token) {
        await removeTempCompanyDocument(
          previousPendingFile.documentType || documentType,
          previousPendingFile.token
        ).catch(() => {});
      }

      setPendingDocuments(prev => {
        revokePreviewUrl(prev[fieldKey]?.previewUrl);

        return {
          ...prev,
          [fieldKey]: {
            token: response.document.token,
            fileName: response.document.originalName || file.name,
            documentType,
            mimeType: file.type || response.document.mimeType || "",
            previewUrl
          }
        };
      });

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: err.response?.data?.message || "Unable to upload this document.",
        confirmButtonColor: "#101eb9"
      });
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldKey]: false }));
    }
  };

  const handlePendingDocumentRemove = async ({ fieldKey, documentType }) => {
    const pendingFile = pendingDocuments[fieldKey];

    if (!pendingFile?.token) {
      return;
    }

    try {
      await removeTempCompanyDocument(documentType, pendingFile.token);
      revokePreviewUrl(pendingFile.previewUrl);

      setPendingDocuments(prev => {
        const next = { ...prev };
        delete next[fieldKey];
        return next;
      });

    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Unable to remove file",
        text: err.response?.data?.message || "Please try removing this file again.",
        confirmButtonColor: "#101eb9"
      });
    }
  };

  const handleSave = async () => {
    if (!isEditable) {
      Swal.fire({
        icon: "info",
        title: "Profile is read-only",
        text:
          approvalStatus === "submitted"
            ? "This company profile has already been submitted and is awaiting admin review."
            : "This company profile is approved and can no longer be edited.",
        confirmButtonColor: "#101eb9"
      });
      return;
    }

    if (hasUploadingInProgress) {
      Swal.fire({
        icon: "info",
        title: "Uploads still in progress",
        text: "Please wait for all document uploads to finish before saving or submitting.",
        confirmButtonColor: "#101eb9"
      });
      return;
    }

    if (isSetupRoute) {
      const validationMessage = getSetupRouteValidationMessage(form);

      if (validationMessage) {
        Swal.fire({
          icon: "info",
          title: "Complete the required setup fields",
          text: validationMessage,
          confirmButtonColor: "#101eb9"
        });
        return;
      }
    }

    try {
      setSaving(true);
      const documentTokens = Object.fromEntries(
        Object.entries(pendingDocuments)
          .filter(([, payload]) => payload?.token)
          .map(([fieldKey, payload]) => [fieldKey, payload.token])
      );

      const branchesPayload = form.branches.map(branch => {
        const linkedAddresses = getLinkedBranchAddresses(branch.gstin);
        const primaryAddress = linkedAddresses[0] || {};

        return {
          ...branch,
          branchAddresses: linkedAddresses.map((addressItem, addressIndex) => ({
            ...emptyBranchAddress(addressIndex),
            ...addressItem
          })),
          branchName: primaryAddress.branchName || "",
          address: primaryAddress.address || "",
          city: primaryAddress.city || "",
          district: primaryAddress.district || "",
          pinCode: primaryAddress.pinCode || ""
        };
      });

      const payload = {
        companyName: form.companyName,
        companyType: form.concernNature,
        concernNature: form.concernNature,
        exporterImporterCategory: form.exporterImporterCategory,
        headOfficeAddress: form.headOfficeAddress,
        firmMobileNo: form.firmMobileNo,
        firmEmail: form.firmEmail,
        panNumber: form.panNumber,
        panDocumentPath: form.panDocumentPath,
        iecNumber: form.iecNumber,
        iecIssuedAt: form.iecIssuedAt,
        iecDocumentPath: form.iecDocumentPath,
        gstFilingStatus: form.gstFilingStatus,
        gstinDetails: form.gstinDetails,
        dateOfIncorporation: form.dateOfIncorporation,
        incorporationCertificateNo: form.incorporationCertificateNo,
        incorporationDocumentPath: form.incorporationDocumentPath,
        udhyamCertificateNo: form.udhyamCertificateNo,
        udhyamStatus: form.udhyamStatus,
        udhyamDocumentPath: form.udhyamDocumentPath,
        shopEstablishmentNumber: form.shopEstablishmentNumber,
        shopEstablishmentDocumentPath: form.shopEstablishmentDocumentPath,
        partnershipDeedNumber: form.partnershipDeedNumber,
        partnershipDeedDocumentPath: form.partnershipDeedDocumentPath,
        rcmcNumber: form.rcmcNumber,
        rcmcValidUntil: form.rcmcValidUntil,
        isSez: form.isSez,
        branches: branchesPayload,
        keyPeople: form.keyPeople,
        authorisedSignatories: form.authorisedSignatories,
        portalCredentials: form.portalCredentials,
        documents: documentTokens
      };

      const response = await API.put("/auth/company-profile", payload);
      const normalized = ensureSetupRouteDefaults(
        normalizeProfile({ ...response.data, user })
      );
      Object.values(pendingDocuments).forEach(item => revokePreviewUrl(item?.previewUrl));

      setForm(normalized);
      setDocumentCatalog(response.data.documentCatalog || []);
      if (response.data.onboarding?.companyProfileEditable === false) {
        clearDraft();
      } else {
        writeDraft(normalized);
      }
      setPendingDocuments({});
      updateOnboarding(response.data.onboarding || null);

      Swal.fire({
        icon: "success",
        title:
          response.data.onboarding?.profileApprovalStatus === "submitted"
            ? "Company profile submitted"
            : "Company profile saved",
        text:
          response.data.onboarding?.profileApprovalStatus === "submitted"
            ? "Form has been submitted. Your dashboard will be activated within 24 hours."
            : "All section details were saved successfully.",
        confirmButtonColor: "#101eb9"
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: err.response?.data?.message || "Unable to save the company profile.",
        confirmButtonColor: "#101eb9"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Loading company profile...</p>
      </div>
    );
  }

  const viewSavedDocument = async (documentUrl) => {
    try {
      await openClientCompanyProfileDocument(documentUrl);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Unable to open file",
        text: err.response?.data?.message || "The saved document could not be opened.",
        confirmButtonColor: "#101eb9"
      });
    }
  };

  if (isSetupRoute) {
    const ActiveQuickFormIcon = activeQuickFormSection.icon;
    const uploadedSetupDocumentCount = [
      form.panDocumentPath || pendingDocuments.pan?.token,
      form.iecDocumentPath || pendingDocuments.iec?.token,
      form.gstinDetails[0]?.documentPath || pendingDocuments.gstin_0?.token,
      form.incorporationDocumentPath || pendingDocuments.incorporation?.token,
      form.udhyamDocumentPath || pendingDocuments.udhyam?.token,
      form.shopEstablishmentDocumentPath || pendingDocuments.shopEstablishment?.token,
      form.partnershipDeedDocumentPath || pendingDocuments.partnershipDeed?.token
    ].filter(Boolean).length;

    return (
      <div className="mx-auto max-w-6xl space-y-6 pb-10">
        <section className="overflow-hidden rounded-[40px] border border-[#d7e3ff] bg-[linear-gradient(135deg,#fffef8_0%,#fff5df_35%,#f7faff_100%)] shadow-[0_22px_60px_rgba(15,23,42,0.08)]">
          <div className="border-b border-[#e7dcc4] px-6 py-8 lg:px-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.26em] text-amber-700">
                  Client Setup Form
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                  Company Profile Submission
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                  Complete the required company setup form below. Once submitted, the request
                  will be shared with the admin for review before dashboard access is enabled.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <SummaryCard title="CDCR Number" value={user?.userCode || form.cdcrNo} />
                <SummaryCard title="Key People" value={String(form.keyPeople.length)} />
                <SummaryCard title="Uploaded Docs" value={String(uploadedSetupDocumentCount)} />
              </div>
            </div>
          </div>
        </section>

        {!isEditable ? (
          <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {approvalStatus === "submitted"
              ? "Your form has already been submitted and is now locked while the admin reviews it."
              : "This setup form has been approved. The submitted details are shown below in read-only mode."}
          </div>
        ) : null}

        <div className="rounded-[32px] border border-[#e7dcc4] bg-white/80 p-3 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="grid gap-3 md:grid-cols-4">
            {QUICK_FORM_SECTIONS.map((section, index) => {
              const SectionIcon = section.icon;
              const isActive = index === quickFormSectionIndex;

              return (
                <button
                  key={section.key}
                  type="button"
                  onClick={() => setQuickFormSectionIndex(index)}
                  className={`flex items-center gap-3 rounded-[24px] border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-[#101eb9] bg-[#101eb9] text-white shadow-[0_16px_35px_rgba(16,30,185,0.22)]"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isActive ? "bg-white/15" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <SectionIcon size={18} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-75">
                      Step 0{index + 1}
                    </p>
                    <p className="mt-1 text-sm font-bold">{section.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <FormInteractivityContext.Provider value={{ readOnly: !isEditable }}>
          <div className="rounded-[36px] border border-slate-200 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#fff1cc_0%,#eef4ff_100%)] text-[#101eb9]">
                <ActiveQuickFormIcon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                  Quick Form Section
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {activeQuickFormSection.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {activeQuickFormSection.key === "company"
                    ? "Capture the firm identity first so documents and portal details stay mapped to the right account."
                    : activeQuickFormSection.key === "documents"
                      ? "Enter each registration number manually and upload its supporting document separately."
                      : activeQuickFormSection.key === "people"
                        ? "Add each decision-maker, enter PAN and Aadhaar numbers manually, and upload the supporting files."
                        : "Finish the mandatory portal credentials and add any extra portal access in one compact place."}
                </p>
              </div>
            </div>

            {activeQuickFormSection.key === "company" ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <Field
                    label="Firm Name"
                    placeholder="Enter the firm name"
                    value={form.companyName}
                    onChange={event => updateField("companyName", event.target.value)}
                  />
                  <SelectField
                    label="Nature of Concern / Firm"
                    placeholder="Select the concern type"
                    value={form.concernNature}
                    onChange={event => updateField("concernNature", event.target.value)}
                    options={COMPANY_TYPE_OPTIONS}
                  />
                  <Field
                    label="Firm Mobile No"
                    placeholder="Enter the firm mobile number"
                    value={form.firmMobileNo}
                    onChange={event => updateField("firmMobileNo", event.target.value)}
                  />
                  <Field
                    label="Firm Email ID"
                    placeholder="Enter the correspondence email"
                    value={form.firmEmail}
                    onChange={event => updateField("firmEmail", event.target.value)}
                  />
                  <SelectField
                    label="Category of Exporters / Importers"
                    placeholder="Select the category"
                    value={form.exporterImporterCategory}
                    onChange={event => updateField("exporterImporterCategory", event.target.value)}
                    options={EXPORTER_CATEGORY_OPTIONS}
                    className="md:col-span-2"
                  />
                </div>

              </div>
            ) : null}

            {activeQuickFormSection.key === "documents" ? (
              <div className="mt-8 space-y-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <DocumentField
                    label="Attachment - PAN Card Copy"
                    helper="Upload the PAN card copy as a supporting attachment. Enter the PAN number separately below."
                    value={form.panDocumentPath}
                    savedDocumentUrl={savedDocumentUrls.pan}
                    fieldKey="pan"
                    documentType="pan"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.pan)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                  <DocumentField
                    label="Attachment - IEC Certificate Copy"
                    helper="Upload the IEC certificate copy as a supporting attachment. Enter the IEC number separately below."
                    value={form.iecDocumentPath}
                    savedDocumentUrl={savedDocumentUrls.iec}
                    fieldKey="iec"
                    documentType="iec"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.iec)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                  <DocumentField
                    label="Attachment - GST Certificate Copy"
                    helper="Upload the GST certificate copy as a supporting attachment. Enter the GSTIN separately below."
                    value={form.gstinDetails[0]?.documentPath}
                    savedDocumentUrl={savedDocumentUrls.gstin_0}
                    fieldKey="gstin_0"
                    documentType="gstin"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.gstin_0)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                  <DocumentField
                    label="Attachment - Incorporation Certificate Copy"
                    helper="Upload the incorporation certificate copy. Enter its number and date separately below."
                    value={form.incorporationDocumentPath}
                    savedDocumentUrl={savedDocumentUrls.incorporation}
                    fieldKey="incorporation"
                    documentType="incorporation"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.incorporation)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                  <DocumentField
                    label="Attachment - Udhyam Certificate Copy"
                    helper="Upload the Udyam certificate copy. Enter its registration number separately below."
                    value={form.udhyamDocumentPath}
                    savedDocumentUrl={savedDocumentUrls.udhyam}
                    fieldKey="udhyam"
                    documentType="udhyam"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.udhyam)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                  <DocumentField
                    label="Attachment - Shop Establishment"
                    helper="Upload the Shop & Establishment certificate and enter its registration number separately below."
                    value={form.shopEstablishmentDocumentPath}
                    savedDocumentUrl={savedDocumentUrls.shopEstablishment}
                    fieldKey="shopEstablishment"
                    documentType="shop_establishment"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.shopEstablishment)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                  <DocumentField
                    label="Attachment - Partnership Deed"
                    helper="Upload the partnership deed and enter its deed or registration number separately below."
                    value={form.partnershipDeedDocumentPath}
                    savedDocumentUrl={savedDocumentUrls.partnershipDeed}
                    fieldKey="partnershipDeed"
                    documentType="partnership_deed"
                    accept=".pdf,.png,.jpg,.jpeg"
                    pendingDocuments={pendingDocuments}
                    onUpload={handleDocumentUpload}
                    uploading={Boolean(uploadingFields.partnershipDeed)}
                    onRemove={handlePendingDocumentRemove}
                    onViewSavedFile={viewSavedDocument}
                    readOnly={!isEditable}
                  />
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#fbfdff_0%,#f8fbff_100%)] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Document & Registration Numbers
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        Enter the numbers shown on your supporting documents
                      </h3>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                      Manual entry
                    </span>
                  </div>

                  <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field
                      label="PAN Card Number"
                      placeholder="Enter PAN number"
                      value={form.panNumber}
                      onChange={event => updateField("panNumber", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="IEC Certificate Number"
                      placeholder="Enter IEC number"
                      value={form.iecNumber}
                      onChange={event => updateField("iecNumber", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="GST Certificate Number"
                      placeholder="Enter GSTIN"
                      value={form.gstinDetails[0]?.gstin || ""}
                      onChange={event => updateListItem("gstinDetails", 0, "gstin", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Incorporation Certificate Number"
                      placeholder="Enter incorporation certificate number"
                      value={form.incorporationCertificateNo}
                      onChange={event => updateField("incorporationCertificateNo", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Incorporation Date"
                      placeholder="Select incorporation date"
                      type="date"
                      value={form.dateOfIncorporation}
                      onChange={event => updateField("dateOfIncorporation", event.target.value)}
                    />
                    <Field
                      label="UDYAM Registration Number"
                      placeholder="Enter UDYAM registration number"
                      value={form.udhyamCertificateNo}
                      onChange={event => updateField("udhyamCertificateNo", event.target.value.toUpperCase())}
                    />
                    <SelectField
                      label="UDYAM Status"
                      placeholder="Select UDYAM status"
                      value={form.udhyamStatus}
                      onChange={event => updateField("udhyamStatus", event.target.value)}
                      options={UDHYAM_STATUS_OPTIONS}
                    />
                    <Field
                      label="Shop & Establishment Number"
                      placeholder="Enter registration number"
                      value={form.shopEstablishmentNumber}
                      onChange={event => updateField("shopEstablishmentNumber", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Partnership Deed Number"
                      placeholder="Enter deed or registration number"
                      value={form.partnershipDeedNumber}
                      onChange={event => updateField("partnershipDeedNumber", event.target.value.toUpperCase())}
                    />
                  </div>
                </div>

              </div>
            ) : null}

            {activeQuickFormSection.key === "people" ? (
              <div className="mt-8 space-y-5">
                {form.keyPeople.map((person, index) => (
                  <div key={person.id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-slate-900">Key Person {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeListItem("keyPeople", index)}
                        disabled={!isEditable || form.keyPeople.length === 1}
                        className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>

                    <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <Field
                        label="Director Name"
                        placeholder="Enter the director name"
                        value={person.directorName}
                        onChange={event =>
                          updateListItem("keyPeople", index, "directorName", event.target.value)
                        }
                      />
                      <Field
                        label="Designation"
                        placeholder="Enter the designation"
                        value={person.designation}
                        onChange={event =>
                          updateListItem("keyPeople", index, "designation", event.target.value)
                        }
                      />
                      <Field
                        label="PAN Card Number"
                        placeholder="Enter PAN number"
                        value={person.panCardNo}
                        onChange={event =>
                          updateListItem("keyPeople", index, "panCardNo", event.target.value.toUpperCase())
                        }
                      />
                      <Field
                        label="Aadhaar Card Number"
                        placeholder="Enter Aadhaar number"
                        value={person.aadharCardNo}
                        onChange={event =>
                          updateListItem("keyPeople", index, "aadharCardNo", event.target.value.replace(/\D/g, "").slice(0, 12))
                        }
                      />
                    </div>

                    <div className="mt-5 grid gap-4 lg:grid-cols-2">
                      <DocumentField
                        label="Attachment - PAN Card Copy"
                        helper="Upload the PAN card copy for this key person."
                        value={person.panDocumentPath}
                        savedDocumentUrl={savedDocumentUrls[`key_person_pan_${index}`]}
                        fieldKey={`key_person_pan_${index}`}
                        documentType="key_person_pan"
                        accept=".pdf,.png,.jpg,.jpeg"
                        pendingDocuments={pendingDocuments}
                        onUpload={handleDocumentUpload}
                        uploading={Boolean(uploadingFields[`key_person_pan_${index}`])}
                        onRemove={handlePendingDocumentRemove}
                        onViewSavedFile={viewSavedDocument}
                        readOnly={!isEditable}
                      />
                      <DocumentField
                        label="Attachment - Aadhaar Card Copy"
                        helper="Upload the Aadhaar card copy for this key person."
                        value={person.aadharDocumentPath}
                        savedDocumentUrl={savedDocumentUrls[`key_person_aadhar_${index}`]}
                        fieldKey={`key_person_aadhar_${index}`}
                        documentType="key_person_aadhar"
                        accept=".pdf,.png,.jpg,.jpeg"
                        pendingDocuments={pendingDocuments}
                        onUpload={handleDocumentUpload}
                        uploading={Boolean(uploadingFields[`key_person_aadhar_${index}`])}
                        onRemove={handlePendingDocumentRemove}
                        onViewSavedFile={viewSavedDocument}
                        readOnly={!isEditable}
                      />
                    </div>
                  </div>
                ))}

                {isEditable ? (
                  <button
                    type="button"
                    onClick={() => addListItem("keyPeople", emptyKeyPerson)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Add Key Person
                  </button>
                ) : null}
              </div>
            ) : null}

            {activeQuickFormSection.key === "portals" ? (
              <div className="mt-8 space-y-5">
                {form.portalCredentials.slice(0, 2).map((portal, index) => (
                  <div key={portal.id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <Field
                        label="Portal Name"
                        placeholder=""
                        value={portal.portalName}
                        onChange={() => {}}
                        readOnly
                        className="flex-1"
                      />
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-rose-600">
                        Mandatory
                      </span>
                    </div>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <Field
                        label="User ID"
                        placeholder="Enter the portal user ID"
                        value={portal.userId}
                        onChange={event =>
                          updateListItem("portalCredentials", index, "userId", event.target.value)
                        }
                      />
                      <Field
                        label="Password"
                        placeholder="Enter the portal password"
                        value={portal.password}
                        onChange={event =>
                          updateListItem("portalCredentials", index, "password", event.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}

                {form.portalCredentials.slice(2).map((portal, index) => {
                  const actualIndex = index + 2;

                  return (
                    <div key={portal.id} className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-bold text-slate-900">Additional Portal {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeListItem("portalCredentials", actualIndex)}
                          disabled={!isEditable}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600"
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>
                      <div className="mt-5 grid gap-5 md:grid-cols-3">
                        <SelectField
                          label="Portal Name"
                          placeholder="Select the portal"
                          value={portal.portalName}
                          onChange={event =>
                            updateListItem(
                              "portalCredentials",
                              actualIndex,
                              "portalName",
                              event.target.value
                            )
                          }
                          options={PORTAL_NAME_OPTIONS}
                        />
                        <Field
                          label="User ID"
                          placeholder="Enter the portal user ID"
                          value={portal.userId}
                          onChange={event =>
                            updateListItem(
                              "portalCredentials",
                              actualIndex,
                              "userId",
                              event.target.value
                            )
                          }
                        />
                        <Field
                          label="Password"
                          placeholder="Enter the portal password"
                          value={portal.password}
                          onChange={event =>
                            updateListItem(
                              "portalCredentials",
                              actualIndex,
                              "password",
                              event.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  );
                })}

                {isEditable ? (
                  <button
                    type="button"
                    onClick={() => addListItem("portalCredentials", emptyPortal)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#101eb9] px-4 py-3 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Add Portal Credentials
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </FormInteractivityContext.Provider>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setQuickFormSectionIndex(index => Math.max(index - 1, 0))}
            disabled={quickFormSectionIndex === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous Section
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            {quickFormSectionIndex < QUICK_FORM_SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setQuickFormSectionIndex(index =>
                    Math.min(index + 1, QUICK_FORM_SECTIONS.length - 1)
                  )
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-5 py-3 text-sm font-semibold text-white"
              >
                Next Section
                <ChevronRight size={16} />
              </button>
            ) : null}

            {isEditable ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || hasUploadingInProgress}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#84c441] px-8 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Submitting..." : hasUploadingInProgress ? "Uploading..." : "Submit"}
                </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className={`overflow-hidden border shadow-[0_22px_60px_rgba(15,23,42,0.08)] ${
          isSetupRoute
            ? "rounded-[40px] border-[#d7e3ff] bg-[linear-gradient(135deg,#fffdf7_0%,#fff7ea_38%,#f6f9ff_100%)]"
            : "rounded-[36px] border-slate-200/80 bg-[linear-gradient(180deg,#fbfcff_0%,#f2f6ff_100%)]"
        }`}
      >
        <div className="border-b border-slate-200/80 px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-[0.26em] ${
                  isSetupRoute ? "text-amber-700" : "text-blue-600"
                }`}
              >
                {isSetupRoute ? "Mandatory Setup Form" : "Company Workspace"}
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
                {isSetupRoute ? "Complete Your Company Profile" : "Company Profile Setup"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                {isSetupRoute
                  ? "Finish the required company profile form before entering the portal. The field set stays the same, while this setup page uses a cleaner standalone layout."
                  : "A cleaner five-step setup with stronger navigation and less visual clutter."}
              </p>
            </div>

            <div className={`grid gap-3 ${isSetupRoute ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-3"}`}>
              <SummaryCard title="CDCR Number" value={user?.userCode || form.cdcrNo} />
              <SummaryCard title="Sections Done" value={`${completedSteps}/5`} />
              <SummaryCard title="GSTIN Entries" value={String(gstinOptions.length || 0)} />
            </div>
          </div>
        </div>

        <div className={`overflow-x-auto px-6 py-5 lg:px-8 ${isSetupRoute ? "bg-white/35" : ""}`}>
          <div className="flex min-w-max items-start gap-3">
            {STEP_DEFINITIONS.map((step, index) => {
              const isActive = index === activeStep;
              const isComplete = completedStepState[step.key];

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => moveToStep(index)}
                  className="flex min-w-[150px] flex-1 items-start gap-3 text-left"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border-2 ${
                        isActive
                          ? "border-[#101eb9] bg-[#101eb9] text-white"
                          : isComplete
                            ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                            : "border-rose-300 bg-white text-rose-400"
                      }`}
                    >
                      {isComplete && !isActive ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <step.icon size={18} />
                      )}
                    </div>
                    {index < STEP_DEFINITIONS.length - 1 ? (
                      <div
                        className={`mt-2 hidden h-1 w-24 rounded-full md:block ${
                          index < activeStep ? "bg-[#101eb9]" : "bg-rose-200"
                        }`}
                      />
                    ) : null}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-bold ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                      {step.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {isActive ? "Currently open" : "Tap to navigate"}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <section
        className={`border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:p-8 ${
          isSetupRoute
            ? "rounded-[40px] border-[#efe3c8] p-5"
            : "rounded-[32px] border-slate-100 p-6"
        }`}
      >
        <div className="space-y-6">
          <SectionHeader
            icon={activeStepConfig.icon}
            title={activeStepConfig.title}
            description={activeStepConfig.description}
          />

          {!isEditable ? (
            <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              {approvalStatus === "submitted"
                ? "Your company profile has been submitted and is now read-only while the admin reviews it."
                : approvalStatus === "approved"
                  ? "Your company profile has been approved. The submitted details are shown below in read-only mode."
                  : "Please complete and submit the Quick Form first. This dashboard view stays read-only until the setup form is submitted."}
            </div>
          ) : null}

          <FormInteractivityContext.Provider value={{ readOnly: !isEditable }}>
          <div className="space-y-6">
          {activeStep === 0 ? (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <div className="flex min-w-max gap-3">
                  {COMPANY_PROFILE_SUBSTEPS.map((subStep, index) => {
                    const isActive = index === companyProfileSubStep;
                    return (
                      <button
                        key={subStep.key}
                        type="button"
                        onClick={() => moveCompanyProfileSubStep(index)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-[#101eb9] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {subStep.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-slate-50/70 p-5">
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Company Profile Step {companyProfileSubStep + 1}
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-900">
                    {activeCompanyProfileSubStep.title}
                  </h3>
                </div>

                {companyProfileSubStep === 0 ? (
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field
                      label="Firm Name"
                      placeholder="Enter the legal company or firm name"
                      value={form.companyName}
                      onChange={event => updateField("companyName", event.target.value)}
                    />
                    <SelectField
                      label="Nature of Concern"
                      placeholder="Select the concern type"
                      value={form.concernNature}
                      onChange={event => updateField("concernNature", event.target.value)}
                      options={COMPANY_TYPE_OPTIONS}
                    />
                    <SelectField
                      label="Exporter / Importer Category"
                      placeholder="Select the category"
                      value={form.exporterImporterCategory}
                      onChange={event =>
                        updateField("exporterImporterCategory", event.target.value)
                      }
                      options={EXPORTER_CATEGORY_OPTIONS}
                    />
                    <Field
                      label="PAN Number"
                      placeholder="Enter PAN number"
                      value={form.panNumber}
                      onChange={event => updateField("panNumber", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="IEC Number"
                      placeholder="Enter IEC number"
                      value={form.iecNumber}
                      onChange={event => updateField("iecNumber", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Udhyam Certificate Number"
                      placeholder="Enter UDYAM registration number"
                      value={form.udhyamCertificateNo}
                      onChange={event => updateField("udhyamCertificateNo", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Firm Mobile Number"
                      placeholder="Enter the mobile number"
                      value={form.firmMobileNo}
                      onChange={event => updateField("firmMobileNo", event.target.value)}
                    />
                    <Field
                      label="Firm Email"
                      placeholder="Enter the firm email"
                      value={form.firmEmail}
                      onChange={event =>
                        updateField("firmEmail", event.target.value)
                      }
                    />
                    <SelectField
                      label="Udhyam Status"
                      placeholder="Select Udhyam status"
                      value={form.udhyamStatus}
                      onChange={event => updateField("udhyamStatus", event.target.value)}
                      options={UDHYAM_STATUS_OPTIONS}
                    />
                    <SelectField
                      label="SEZ Location"
                      placeholder="Select SEZ status"
                      value={form.isSez}
                      onChange={event => updateField("isSez", event.target.value)}
                      options={YES_NO_OPTIONS}
                    />
                    <TextareaField
                      label="Head Office Address"
                      placeholder="Enter the head office address"
                      value={form.headOfficeAddress}
                      onChange={event => updateField("headOfficeAddress", event.target.value)}
                      className="md:col-span-2 xl:col-span-3"
                    />
                  </div>
                ) : null}

                {companyProfileSubStep === 1 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          GSTIN Details
                        </p>
                        <h4 className="mt-2 text-lg font-bold text-slate-900">
                          Keep only active GSTIN records
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => addListItem("gstinDetails", emptyGstin)}
                        disabled={!isEditable}
                        className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                      >
                        <Plus size={16} />
                        Add GSTIN
                      </button>
                    </div>

                    <div className="space-y-4">
                      {form.gstinDetails.map((item, index) => (
                        <div key={item.id} className="rounded-[24px] border border-slate-200 bg-white p-4">
                          <div className="grid gap-4 md:grid-cols-[1fr,auto]">
                            <Field
                              label={`GSTIN Number ${index + 1}`}
                              placeholder="Enter GSTIN"
                              value={item.gstin}
                              onChange={event => updateListItem("gstinDetails", index, "gstin", event.target.value.toUpperCase())}
                            />
                            <button
                              type="button"
                              onClick={() => removeListItem("gstinDetails", index)}
                              disabled={!isEditable || form.gstinDetails.length === 1}
                              className="mt-7 inline-flex h-[50px] items-center justify-center gap-2 rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={16} />
                              Remove
                            </button>
                          </div>

                          <div className="mt-4">
                            <DocumentField
                              label={`GST Certificate Copy ${index + 1}`}
                              helper="Upload the GST certificate for this GSTIN."
                              value={item.documentPath}
                              savedDocumentUrl={savedDocumentUrls[`gstin_${index}`]}
                              fieldKey={`gstin_${index}`}
                              documentType="gstin"
                              accept=".pdf,.png,.jpg,.jpeg"
                              pendingDocuments={pendingDocuments}
                              onUpload={handleDocumentUpload}
                              uploading={Boolean(uploadingFields[`gstin_${index}`])}
                              onRemove={handlePendingDocumentRemove}
                              onViewSavedFile={viewSavedDocument}
                              readOnly={!isEditable}
                            />
                          </div>

                          <div className="mt-6 space-y-4">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                  Branch Addresses
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Add multiple branch addresses under this GSTIN.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => addGstinBranchAddress(index)}
                                disabled={!isEditable}
                                className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
                              >
                                <Plus size={16} />
                                Add Address
                              </button>
                            </div>

                            {(item.branchAddresses || []).map((addressItem, addressIndex) => (
                              <div
                                key={addressItem.id}
                                className="rounded-[22px] border border-slate-200 bg-slate-50/70 p-4"
                              >
                                <div className="mb-4 flex items-center justify-between gap-4">
                                  <p className="text-sm font-bold text-slate-900">
                                    Address {addressIndex + 1}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => removeGstinBranchAddress(index, addressIndex)}
                                    disabled={!isEditable || (item.branchAddresses || []).length === 1}
                                    className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Trash2 size={16} />
                                    Remove
                                  </button>
                                </div>

                                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                  <Field
                                    label="Branch Name"
                                    placeholder="Enter the branch name"
                                    value={addressItem.branchName}
                                    onChange={event =>
                                      updateGstinBranchAddressItem(
                                        index,
                                        addressIndex,
                                        "branchName",
                                        event.target.value
                                      )
                                    }
                                  />
                                  <Field
                                    label="City"
                                    placeholder="Enter the city"
                                    value={addressItem.city}
                                    onChange={event =>
                                      updateGstinBranchAddressItem(
                                        index,
                                        addressIndex,
                                        "city",
                                        event.target.value
                                      )
                                    }
                                  />
                                  <Field
                                    label="District"
                                    placeholder="Enter the district"
                                    value={addressItem.district}
                                    onChange={event =>
                                      updateGstinBranchAddressItem(
                                        index,
                                        addressIndex,
                                        "district",
                                        event.target.value
                                      )
                                    }
                                  />
                                  <Field
                                    label="Pin Code"
                                    placeholder="Enter the pin code"
                                    value={addressItem.pinCode}
                                    onChange={event =>
                                      updateGstinBranchAddressItem(
                                        index,
                                        addressIndex,
                                        "pinCode",
                                        event.target.value
                                      )
                                    }
                                  />
                                  <TextareaField
                                    label="Branch Address"
                                    placeholder="Enter the branch address"
                                    value={addressItem.address}
                                    onChange={event =>
                                      updateGstinBranchAddressItem(
                                        index,
                                        addressIndex,
                                        "address",
                                        event.target.value
                                      )
                                    }
                                    className="md:col-span-2 xl:col-span-3"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {companyProfileSubStep === 2 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Date of Incorporation"
                      type="date"
                      placeholder="Select the incorporation date"
                      value={form.dateOfIncorporation}
                      onChange={event =>
                        updateField("dateOfIncorporation", event.target.value)
                      }
                    />
                  </div>
                ) : null}

                {companyProfileSubStep === 3 ? (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      <FileUp size={16} />
                      Company Documents
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {CLIENT_COMPANY_DOCUMENT_FIELDS.map(item => (
                        <DocumentField
                          key={item.key}
                          label={item.label}
                          helper={`Upload ${item.label.toLowerCase()}.`}
                          value={form[`${item.key}DocumentPath`]}
                          savedDocumentUrl={savedDocumentUrls[item.key]}
                          fieldKey={item.key}
                          documentType={item.type}
                          accept={item.accept}
                          pendingDocuments={pendingDocuments}
                          onUpload={handleDocumentUpload}
                          uploading={Boolean(uploadingFields[item.key])}
                          onRemove={handlePendingDocumentRemove}
                          onViewSavedFile={viewSavedDocument}
                          readOnly={!isEditable}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      moveCompanyProfileSubStep(Math.max(companyProfileSubStep - 1, 0))
                    }
                    disabled={companyProfileSubStep === 0}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                    Previous Sub-Page
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveCompanyProfileSubStep(
                        Math.min(companyProfileSubStep + 1, COMPANY_PROFILE_SUBSTEPS.length - 1)
                      )
                    }
                    disabled={companyProfileSubStep === COMPANY_PROFILE_SUBSTEPS.length - 1}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next Sub-Page
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {activeStep === 1 ? (
            <div className="space-y-4">
              {form.branches.map((branch, index) => (
                <div key={branch.id} className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Branch {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        Branch record and GST mapping
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeListItem("branches", index)}
                      disabled={!isEditable || form.branches.length === 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <SelectField
                      label="Linked GSTIN"
                      placeholder="Select a GSTIN from Company Profile"
                      value={branch.gstin}
                      onChange={event => handleBranchGstinChange(index, event.target.value)}
                      options={getAvailableGstinOptions(index)}
                    />
                    <Field
                      label="Branch Code"
                      placeholder="Enter the branch code"
                      value={branch.branchCode}
                      onChange={event =>
                        updateListItem("branches", index, "branchCode", event.target.value)
                      }
                    />
                    <Field
                      label="Branch Number"
                      placeholder="Enter the branch number"
                      value={branch.branchNumber}
                      onChange={event =>
                        updateListItem("branches", index, "branchNumber", event.target.value)
                      }
                    />
                    <Field
                      label="State"
                      placeholder="Enter the state"
                      value={branch.state}
                      onChange={event =>
                        updateListItem("branches", index, "state", event.target.value)
                      }
                    />
                    <SelectField
                      label="SEZ Status"
                      placeholder="Select SEZ status"
                      value={branch.isSez}
                      onChange={event =>
                        updateListItem("branches", index, "isSez", event.target.value)
                      }
                      options={YES_NO_OPTIONS}
                    />
                    <SelectField
                      label="EOU Status"
                      placeholder="Select EOU status"
                      value={branch.isEou}
                      onChange={event =>
                        updateListItem("branches", index, "isEou", event.target.value)
                      }
                      options={YES_NO_OPTIONS}
                    />
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Branch Addresses
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        These addresses are fetched automatically from the selected GSTIN in Company Profile.
                      </p>
                    </div>

                    {getLinkedBranchAddresses(branch.gstin).length > 0 ? (
                      getLinkedBranchAddresses(branch.gstin).map((addressItem, addressIndex) => (
                        <div
                          key={addressItem.id || `${branch.id}-linked-${addressIndex}`}
                          className="rounded-[24px] border border-slate-200 bg-white p-4"
                        >
                          <div className="mb-4 flex items-center justify-between gap-4">
                            <p className="text-sm font-bold text-slate-900">
                              Address {addressIndex + 1}
                            </p>
                          </div>

                          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            <Field
                              label="Branch Name"
                              placeholder="Fetched from selected GSTIN"
                              value={addressItem.branchName}
                              onChange={() => {}}
                              readOnly
                              infoText="This address is pulled from Company Profile -> GSTIN Details."
                            />
                            <Field
                              label="City"
                              placeholder="Fetched from selected GSTIN"
                              value={addressItem.city}
                              onChange={() => {}}
                              readOnly
                              infoText="This address is pulled from Company Profile -> GSTIN Details."
                            />
                            <Field
                              label="District"
                              placeholder="Fetched from selected GSTIN"
                              value={addressItem.district}
                              onChange={() => {}}
                              readOnly
                              infoText="This address is pulled from Company Profile -> GSTIN Details."
                            />
                            <Field
                              label="Pin Code"
                              placeholder="Fetched from selected GSTIN"
                              value={addressItem.pinCode}
                              onChange={() => {}}
                              readOnly
                              infoText="This address is pulled from Company Profile -> GSTIN Details."
                            />
                            <TextareaField
                              label="Branch Address"
                              placeholder="Fetched from selected GSTIN"
                              value={addressItem.address}
                              onChange={() => {}}
                              className="md:col-span-2 xl:col-span-3"
                              readOnly
                            />
                          </div>
                        </div>
                      ))
                    ) : branch.gstin ? (
                      <div
                        className="rounded-[24px] border border-slate-200 bg-white p-4"
                      >
                        <p className="text-sm text-slate-500">
                          No branch addresses are available under this GSTIN yet. Add them first in
                          Company Profile - GSTIN Details.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-4">
                        <p className="text-sm text-slate-500">
                          Select a linked GSTIN to load its branch addresses here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addListItem("branches", emptyBranch)}
                disabled={!isEditable}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add Another Branch
              </button>
            </div>
          ) : null}

          {activeStep === 2 ? (
            <div className="space-y-4">
              {form.keyPeople.map((person, index) => (
                <div key={person.id} className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Key Person {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        Core contact and identity details
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeListItem("keyPeople", index)}
                      disabled={!isEditable || form.keyPeople.length === 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <SelectField
                      label="Title"
                      placeholder="Select a title"
                      value={person.title}
                      onChange={event =>
                        updateListItem("keyPeople", index, "title", event.target.value)
                      }
                      options={KEY_PERSON_TITLE_OPTIONS}
                    />
                    <Field
                      label="Director / Partner Name"
                      placeholder="Enter the full name"
                      value={person.directorName}
                      onChange={event =>
                        updateListItem("keyPeople", index, "directorName", event.target.value)
                      }
                    />
                    <Field
                      label="Designation"
                      placeholder="Enter the designation"
                      value={person.designation}
                      onChange={event =>
                        updateListItem("keyPeople", index, "designation", event.target.value)
                      }
                    />
                    <Field
                      label="Mobile Number"
                      placeholder="Enter the mobile number"
                      value={person.mobileNumber}
                      onChange={event =>
                        updateListItem("keyPeople", index, "mobileNumber", event.target.value)
                      }
                    />
                    <Field
                      label="PAN Card Number"
                      placeholder="Enter PAN number"
                      value={person.panCardNo}
                      onChange={event => updateListItem("keyPeople", index, "panCardNo", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Aadhaar Card Number"
                      placeholder="Enter Aadhaar number"
                      value={person.aadharCardNo}
                      onChange={event => updateListItem("keyPeople", index, "aadharCardNo", event.target.value.replace(/\D/g, "").slice(0, 12))}
                    />
                    <Field
                      label="DIN"
                      placeholder="Enter the DIN number"
                      value={person.din}
                      onChange={event =>
                        updateListItem("keyPeople", index, "din", event.target.value)
                      }
                    />
                    <Field
                      label="Passport Number"
                      placeholder="Enter passport number if applicable"
                      value={person.passportNumber}
                      onChange={event =>
                        updateListItem("keyPeople", index, "passportNumber", event.target.value)
                      }
                    />
                    <SelectField
                      label="Foreign Director"
                      placeholder="Select yes or no"
                      value={person.isForeignDirector}
                      onChange={event =>
                        updateListItem(
                          "keyPeople",
                          index,
                          "isForeignDirector",
                          event.target.value
                        )
                      }
                      options={YES_NO_OPTIONS}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <DocumentField
                      label={`Key Person PAN Copy ${index + 1}`}
                      helper="Upload the PAN copy for this key person."
                      value={person.panDocumentPath}
                      savedDocumentUrl={savedDocumentUrls[`key_person_pan_${index}`]}
                      fieldKey={`key_person_pan_${index}`}
                      documentType="key_person_pan"
                      accept=".pdf,.png,.jpg,.jpeg"
                      pendingDocuments={pendingDocuments}
                      onUpload={handleDocumentUpload}
                      uploading={Boolean(uploadingFields[`key_person_pan_${index}`])}
                      onRemove={handlePendingDocumentRemove}
                      onViewSavedFile={viewSavedDocument}
                      readOnly={!isEditable}
                    />
                    <DocumentField
                      label={`Key Person Aadhaar Copy ${index + 1}`}
                      helper="Upload the Aadhaar copy for this key person."
                      value={person.aadharDocumentPath}
                      savedDocumentUrl={savedDocumentUrls[`key_person_aadhar_${index}`]}
                      fieldKey={`key_person_aadhar_${index}`}
                      documentType="key_person_aadhar"
                      accept=".pdf,.png,.jpg,.jpeg"
                      pendingDocuments={pendingDocuments}
                      onUpload={handleDocumentUpload}
                      uploading={Boolean(uploadingFields[`key_person_aadhar_${index}`])}
                      onRemove={handlePendingDocumentRemove}
                      onViewSavedFile={viewSavedDocument}
                      readOnly={!isEditable}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addListItem("keyPeople", emptyKeyPerson)}
                disabled={!isEditable}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add Another Key Person
              </button>
            </div>
          ) : null}

          {activeStep === 3 ? (
            <div className="space-y-4">
              {form.authorisedSignatories.map((signatory, index) => (
                <div key={signatory.id} className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Authorised Signatory {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-slate-900">
                        PAN and Aadhaar holder details
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeListItem("authorisedSignatories", index)}
                      disabled={!isEditable || form.authorisedSignatories.length === 1}
                      className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field
                      label="PAN Holder Name"
                      placeholder="Enter the PAN holder name"
                      value={signatory.panName}
                      onChange={event =>
                        updateListItem(
                          "authorisedSignatories",
                          index,
                          "panName",
                          event.target.value
                        )
                      }
                    />
                    <Field
                      label="PAN Card Number"
                      placeholder="Enter PAN number"
                      value={signatory.panCardNo}
                      onChange={event => updateListItem("authorisedSignatories", index, "panCardNo", event.target.value.toUpperCase())}
                    />
                    <Field
                      label="Mobile Number"
                      placeholder="Enter the mobile number"
                      value={signatory.mobileNumber}
                      onChange={event =>
                        updateListItem(
                          "authorisedSignatories",
                          index,
                          "mobileNumber",
                          event.target.value
                        )
                      }
                    />
                    <Field
                      label="Aadhaar Holder Name"
                      placeholder="Enter the Aadhaar holder name"
                      value={signatory.aadharName}
                      onChange={event =>
                        updateListItem(
                          "authorisedSignatories",
                          index,
                          "aadharName",
                          event.target.value
                        )
                      }
                    />
                    <Field
                      label="Aadhaar Card Number"
                      placeholder="Enter Aadhaar number"
                      value={signatory.aadharCardNo}
                      onChange={event => updateListItem("authorisedSignatories", index, "aadharCardNo", event.target.value.replace(/\D/g, "").slice(0, 12))}
                    />
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <DocumentField
                      label={`Authorised Signatory PAN Copy ${index + 1}`}
                      helper="Upload the PAN document for this authorised signatory."
                      value={signatory.panDocumentPath}
                      savedDocumentUrl={savedDocumentUrls[`authorised_signatory_pan_${index}`]}
                      fieldKey={`authorised_signatory_pan_${index}`}
                      documentType="authorised_signatory_pan"
                      accept=".pdf,.png,.jpg,.jpeg"
                      pendingDocuments={pendingDocuments}
                      onUpload={handleDocumentUpload}
                      uploading={Boolean(uploadingFields[`authorised_signatory_pan_${index}`])}
                      onRemove={handlePendingDocumentRemove}
                      onViewSavedFile={viewSavedDocument}
                      readOnly={!isEditable}
                    />
                    <DocumentField
                      label={`Authorised Signatory Aadhaar Copy ${index + 1}`}
                      helper="Upload the Aadhaar document for this authorised signatory."
                      value={signatory.aadharDocumentPath}
                      savedDocumentUrl={savedDocumentUrls[`authorised_signatory_aadhar_${index}`]}
                      fieldKey={`authorised_signatory_aadhar_${index}`}
                      documentType="authorised_signatory_aadhar"
                      accept=".pdf,.png,.jpg,.jpeg"
                      pendingDocuments={pendingDocuments}
                      onUpload={handleDocumentUpload}
                      uploading={Boolean(uploadingFields[`authorised_signatory_aadhar_${index}`])}
                      onRemove={handlePendingDocumentRemove}
                      onViewSavedFile={viewSavedDocument}
                      readOnly={!isEditable}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addListItem("authorisedSignatories", emptyAuthorisedSignatory)}
                disabled={!isEditable}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                <Plus size={16} />
                Add Another Signatory
              </button>
            </div>
          ) : null}

          {activeStep === 4 ? (
            <div className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Portal Credentials
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      Save access details for recurring portal use
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => addListItem("portalCredentials", emptyPortal)}
                    disabled={!isEditable}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                  >
                    <Plus size={16} />
                    Add Portal
                  </button>
                </div>

                <div className="mt-6 space-y-4">
                  {form.portalCredentials.map((portal, index) => (
                    <div key={portal.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-bold text-slate-900">Portal {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeListItem("portalCredentials", index)}
                          disabled={!isEditable || form.portalCredentials.length === 1}
                          className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                        <SelectField
                          label="Portal Name"
                          placeholder="Select the portal name"
                          value={portal.portalName}
                          onChange={event =>
                            updateListItem(
                              "portalCredentials",
                              index,
                              "portalName",
                              event.target.value
                            )
                          }
                          options={PORTAL_NAME_OPTIONS}
                        />
                        <Field
                          label="User ID"
                          placeholder="Enter the portal user ID"
                          value={portal.userId}
                          onChange={event =>
                            updateListItem("portalCredentials", index, "userId", event.target.value)
                          }
                        />
                        <Field
                          label="Password"
                          placeholder="Enter the portal password"
                          value={portal.password}
                          onChange={event =>
                            updateListItem(
                              "portalCredentials",
                              index,
                              "password",
                              event.target.value
                            )
                          }
                        />
                        <Field
                          label="Website"
                          placeholder="Enter the portal website URL"
                          value={portal.website}
                          onChange={event =>
                            updateListItem("portalCredentials", index, "website", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#f8fbff_0%,#ffffff_100%)] p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Final Checks
                  </p>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    <SummaryCard title="Portal Records" value={String(form.portalCredentials.length)} />
                    <SummaryCard title="Signatories" value={String(form.authorisedSignatories.length)} />
                    <SummaryCard title="Key People" value={String(form.keyPeople.length)} />
                    <SummaryCard title="Branches" value={String(form.branches.length)} />
                  </div>
              </div>
            </div>
          ) : null}
          </div>
          </FormInteractivityContext.Provider>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                if (activeStep === 0 && companyProfileSubStep > 0) {
                  moveCompanyProfileSubStep(companyProfileSubStep - 1);
                  return;
                }
                moveToStep(Math.max(activeStep - 1, 0));
              }}
              disabled={activeStep === 0 && companyProfileSubStep === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              {isEditable ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || hasUploadingInProgress}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : hasUploadingInProgress ? "Uploading..." : "Save Draft"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (
                    activeStep === 0 &&
                    companyProfileSubStep < COMPANY_PROFILE_SUBSTEPS.length - 1
                  ) {
                    moveCompanyProfileSubStep(companyProfileSubStep + 1);
                    return;
                  }
                  moveToStep(Math.min(activeStep + 1, STEP_DEFINITIONS.length - 1));
                }}
                disabled={activeStep === STEP_DEFINITIONS.length - 1}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#101eb9] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {activeStep === 0 && companyProfileSubStep < COMPANY_PROFILE_SUBSTEPS.length - 1
                  ? "Next Sub-Page"
                  : "Next Section"}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
