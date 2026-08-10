import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import IemRegistrationWorkflow from "./IemRegistrationWorkflow";
import IndustrialLicenseWorkflow from "./IndustrialLicenseWorkflow";
import WpcEtaWorkflow from "./WpcEtaWorkflow";
import UnIipPackagingAuditWorkflow from "./UnIipPackagingAuditWorkflow";
import GstReturnsAuditWorkflow from "./GstReturnsAuditWorkflow";
import GstLutUndertakingWorkflow from "./GstLutUndertakingWorkflow";
import CdscoImportAuthorizationWorkflow from "./CdscoImportAuthorizationWorkflow";
import AqcsPqmsWorkflow from "./AqcsPqmsWorkflow";
import WarehouseLicenseWorkflow from "./WarehouseLicenseWorkflow";
import FactoryLicenseWorkflow from "./FactoryLicenseWorkflow";
import FssaiWorkflow from "./FssaiWorkflow";
import RexRegistrationWorkflow from "./RexRegistrationWorkflow";
import BisRegistrationWorkflow from "./BisRegistrationWorkflow";
import DscServicesWorkflow from "./DscServicesWorkflow";
import EbrcWorkflow from "./EbrcWorkflow";
import EpcgWorkflow from "./EpcgWorkflow";
import IgcrReturnWorkflow from "./IgcrReturnWorkflow";
import PollutionControlWorkflow from "./PollutionControlWorkflow";
import CaCertificationWorkflow from "./CaCertificationWorkflow";
import LmpcWorkflow from "./LmpcWorkflow";
import EprAuthorizationWorkflow from "./EprAuthorizationWorkflow";
import {
  getCertificateOfOriginConfiguration,
  getCertificateOfOriginLedger,
  getCertificateOfOriginQuote,
  getCertificateOfOriginRequests,
  removeCertificateOfOriginDocument,
  saveCertificateOfOriginDraft,
  submitCertificateOfOrigin,
  uploadCertificateOfOriginDocument,
} from "../../services/certificateOfOriginService";
import { getServiceStoreCatalog } from "../../services/serviceCatalogService";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Download,
  Factory,
  FileBadge2,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Globe,
  Landmark,
  Leaf,
  PackageCheck,
  Radio,
  Receipt,
  ReceiptText,
  Save,
  Scale,
  Search,
  ScrollText,
  Shield,
  ShieldCheck,
  Stamp,
  Store,
  Truck,
  Upload,
  Wallet,
  Waves,
  Wrench,
  X,
  Zap,
} from "lucide-react";

const SERVICE_STORE_CATEGORIES = [
  {
    id: "compliance",
    path: "/client/service-store/compliance",
    title: "Compliance",
    eyebrow: "DGFT and Trade Governance",
    description:
      "Certification, return filing, licensing, and regulated documentation services.",
    icon: ShieldCheck,
    available: true,
  },
  {
    id: "licensing",
    path: "/client/service-store/licensing",
    title: "Licensing",
    eyebrow: "Authorisations and Permissions",
    description:
      "Structured licensing workflows and approval-led service requests.",
    icon: Landmark,
    available: true,
  },
  {
    id: "registration",
    path: "/client/service-store/registration",
    title: "Registration",
    eyebrow: "Entity and Filing Setup",
    description:
      "Registration-oriented services for regulated business onboarding.",
    icon: BriefcaseBusiness,
    available: true,
  },
  {
    id: "incentives",
    path: "/client/service-store/incentives",
    title: "Incentives",
    eyebrow: "Benefits and Claims",
    description:
      "Incentive-oriented workflows and claim-linked support services.",
    icon: ReceiptText,
    available: true,
  },
  {
    id: "custom-filing",
    path: "/client/service-store/custom-filing",
    title: "Custom Filing",
    eyebrow: "Trade Documentation",
    description:
      "Custom filing and documentation support across governed submissions.",
    icon: FileSpreadsheet,
    available: true,
  },
  {
    id: "dispute-resolution",
    path: "/client/service-store/dispute-resolution",
    title: "Dispute Resolution",
    eyebrow: "Remedy and Response",
    description:
      "Resolution-led workflows for notices, disputes, and response handling.",
    icon: Shield,
    available: true,
  },
  {
    id: "iso-trademark",
    path: "/client/service-store/iso-trademark",
    title: "ISO & Trademark",
    eyebrow: "Certification and Protection",
    description:
      "Quality system and mark protection categories under one parent menu.",
    icon: Stamp,
    available: true,
  },
  {
    id: "logistics",
    path: "/client/service-store/logistics",
    title: "Logistics",
    eyebrow: "Movement and Coordination",
    description:
      "Operational support for shipping, handling, and logistics activities.",
    icon: Globe,
    available: true,
  },
];

const COMPLIANCE_SERVICES = [
  {
    id: "certificate-of-origin",
    title: "Certificate of Origin",
    subtitle: "Origin certification support",
    caption: "Chamber-certified export origin documentation workflow",
    icon: ScrollText,
    aliases: [
      "certificate-of-origin",
      "coo",
      "certificate-origin",
      "origin-certificate",
    ],
  },
  {
    id: "iem-registration",
    title: "IEM Registration",
    subtitle: "Industrial entrepreneur filing",
    caption: "DPIIT and manufacturing setup support",
    icon: BriefcaseBusiness,
    aliases: ["iem-registration", "iem"],
  },
  {
    id: "industrial-licence",
    title: "Industrial Licence",
    subtitle: "Industrial approval workflow",
    caption: "Licensing support for controlled sectors",
    icon: Factory,
    aliases: ["industrial-licence", "industrial-license", "industrial"],
  },
  {
    id: "factory-license",
    title: "Factory License",
    subtitle: "Factory establishment compliance",
    caption: "Factory licensing, renewal, and statutory approval support",
    icon: Factory,
    aliases: ["factory-license", "factory-licence"],
  },
  {
    id: "fssai",
    title: "FSSAI Licensing",
    subtitle: "Food business regulatory compliance",
    caption: "FSSAI licensing, registration, and renewal support",
    icon: FileCheck2,
    aliases: ["fssai", "fssai-license", "fssai-licensing", "fssai-registration"],
  },
  {
    id: "rex",
    title: "REX Registration",
    subtitle: "Registered exporter onboarding",
    caption: "REX registration and exporter certification assistance",
    icon: Stamp,
    aliases: ["rex", "rex-registration"],
  },
  {
    id: "bis",
    title: "BIS Registration",
    subtitle: "Product conformity certification",
    caption: "BIS documentation, registration, and certification support",
    icon: ShieldCheck,
    aliases: ["bis", "bis-registration"],
  },
  {
    id: "wpc-licence",
    title: "WPC Licence",
    subtitle: "Wireless planning compliance",
    caption: "WPC documentation and filing support",
    icon: Radio,
    aliases: ["wpc-licence", "wpc-license", "wpc"],
  },
  {
    id: "un-iip-certificate",
    title: "UN IIP Packaging Audit",
    subtitle: "Hazardous goods packaging audit",
    caption: "UN performance testing and IIP certification workflow",
    icon: PackageCheck,
    aliases: ["un-iip-certificate", "un-iip", "uniip"],
  },
  {
    id: "gst-return",
    title: "GST Returns & ITC Audit",
    subtitle: "Returns and input tax credit reconciliation",
    caption: "Monthly, annual, and ITC audit workflow",
    icon: ReceiptText,
    aliases: ["gst-return", "gst-returns", "gstr"],
  },
  {
    id: "gst-lut-filing",
    title: "GST LUT Undertaking",
    subtitle: "RFD-11 application and annual renewal",
    caption: "Zero-rated export undertaking workflow",
    icon: ScrollText,
    aliases: ["gst-lut-filing", "gst-lut", "lut"],
  },
  {
    id: "cdsco-drug-control",
    title: "CDSCO Drug Control",
    subtitle: "Drug and device regulatory compliance",
    caption: "Documentation for controlled product imports",
    icon: FileCheck2,
    aliases: ["cdsco-drug-control", "cdsco", "drug-control"],
  },
  {
    id: "aqcs-pqms",
    title: "AQCS & PQMS",
    subtitle: "Animal and plant quarantine compliance",
    caption: "Inspection, NOC, and quarantine documentation",
    icon: Waves,
    aliases: ["aqcs-pqms", "aqcs", "pqms"],
  },
  {
    id: "warehouse-license",
    title: "Warehouse License",
    subtitle: "Warehouse approval and registration",
    caption: "Bonded and operational warehouse support",
    icon: Store,
    aliases: ["warehouse-license", "warehouse-licence", "warehouse"],
  },
  {
    id: "dsc-services",
    title: "DSC Services",
    subtitle: "Digital signature support",
    caption: "Issuance, renewal, and usage coordination",
    icon: Stamp,
    aliases: ["dsc-services", "dsc"],
  },
  {
    id: "ebrc",
    title: "EBRC",
    subtitle: "Single eBRC generation support",
    caption: "Bank realisation certificate processing",
    icon: FileBadge2,
    aliases: ["ebrc"],
  },
  {
    id: "bulk-ebrc",
    title: "Bulk EBRC",
    subtitle: "Batch eBRC processing",
    caption: "High-volume certificate handling support",
    icon: Boxes,
    aliases: ["bulk-ebrc", "bulk-ebrcs"],
  },
  {
    id: "igcr-return",
    title: "IGCR Return",
    subtitle: "IGCR monthly compliance",
    caption: "Imported goods concession reporting support",
    icon: FileSpreadsheet,
    aliases: ["igcr-return", "igcr-returns", "igcr"],
  },
  {
    id: "pollution-control",
    title: "Pollution Control",
    subtitle: "CTE and CTO compliance",
    caption: "State pollution board documentation support",
    icon: Leaf,
    aliases: ["pollution-control", "pollution"],
  },
  {
    id: "ca-certification",
    title: "CA Certification",
    subtitle: "Certified financial declarations",
    caption: "Chartered accountant certificate coordination",
    icon: Building2,
    aliases: ["ca-certification", "ca-certificate", "ca"],
  },
  {
    id: "lmpc",
    title: "LMPC",
    subtitle: "Legal metrology compliance",
    caption: "Packaged commodity importer support",
    icon: Truck,
    aliases: ["lmpc", "legal-metrology"],
  },
  {
    id: "epr-authorisation",
    title: "EPR Authorisation",
    subtitle: "Extended producer responsibility",
    caption: "Waste and recycling compliance support",
    icon: Wrench,
    aliases: ["epr-authorisation", "epr-authorization", "epr"],
  },
];

const CATEGORY_SERVICE_GROUPS = {
  licensing: [
    {
      id: "advance-auth",
      title: "Advance Authorisation",
      subtitle: "DGFT authorisation workflow",
      caption: "End-to-end support for advance authorisation filing.",
      icon: FileCheck2,
    },
    {
      id: "epcg",
      title: "EPCG License",
      subtitle: "Capital goods licensing",
      caption: "Application, documentation, and closure support.",
      icon: Factory,
    },
    {
      id: "star",
      title: "Star Export House",
      subtitle: "Exporter recognition",
      caption: "Status holder filing and supporting documentation.",
      icon: Globe,
    },
    {
      id: "iec",
      title: "IEC Services",
      subtitle: "Importer exporter code",
      caption: "IEC application, modification, and update support.",
      icon: Building2,
    },
  ],
  registration: [
    {
      id: "cdsco",
      title: "CDSCO Registration",
      subtitle: "Drug and device onboarding",
      caption: "Regulatory registration support for controlled products.",
      icon: FileBadge2,
    },
    {
      id: "aqcs",
      title: "AQCS & PQMS",
      subtitle: "Quarantine registration",
      caption: "Animal and plant quarantine support.",
      icon: Waves,
    },
    {
      id: "legal-metrology",
      title: "Legal Metrology",
      subtitle: "Packaged commodity setup",
      caption: "LMPC registration and documentation support.",
      icon: Scale,
    },
  ],
  incentives: [
    {
      id: "rodtep",
      title: "RoDTEP Claims",
      subtitle: "Export remission benefits",
      caption: "Claim preparation and reconciliation support.",
      icon: ReceiptText,
    },
    {
      id: "rosctl",
      title: "RoSCTL Claims",
      subtitle: "Textile incentive support",
      caption: "Scheme filing and claim documentation.",
      icon: Receipt,
    },
    {
      id: "duty",
      title: "Duty Drawback",
      subtitle: "Refund processing",
      caption: "Drawback claim review and filing support.",
      icon: CreditCard,
    },
    {
      id: "interest",
      title: "Interest Equalisation",
      subtitle: "Finance incentive",
      caption: "Eligibility review and claim assistance.",
      icon: Wallet,
    },
    {
      id: "igst",
      title: "IGST Refund",
      subtitle: "Export tax refund",
      caption: "Refund tracking and filing support.",
      icon: Download,
    },
  ],
  "custom-filing": [
    {
      id: "moowr",
      title: "MOOWR Filing",
      subtitle: "Warehouse manufacturing",
      caption: "MOOWR registration and filing workflow.",
      icon: Factory,
    },
    {
      id: "dpd",
      title: "DPD Registration",
      subtitle: "Direct port delivery",
      caption: "DPD onboarding and documentation support.",
      icon: Truck,
    },
    {
      id: "rmcc",
      title: "RMCC Support",
      subtitle: "Customs coordination",
      caption: "RMCC filing and response assistance.",
      icon: Shield,
    },
    {
      id: "svb",
      title: "SVB Filing",
      subtitle: "Valuation branch support",
      caption: "SVB documentation and submission workflow.",
      icon: Scale,
    },
    {
      id: "factory-stuffing",
      title: "Factory Stuffing",
      subtitle: "Export logistics filing",
      caption: "Permission and compliance documentation.",
      icon: PackageCheck,
    },
  ],
  "dispute-resolution": [
    {
      id: "dgft-relaxation",
      title: "DGFT Relaxation",
      subtitle: "Policy relaxation request",
      caption: "Representation drafting and filing support.",
      icon: FileText,
    },
    {
      id: "customs-defense",
      title: "Customs Defence",
      subtitle: "Customs notice support",
      caption: "Response and hearing documentation.",
      icon: Shield,
    },
    {
      id: "scn-reply",
      title: "SCN Reply",
      subtitle: "Show cause response",
      caption: "Drafting, evidence mapping, and submission support.",
      icon: ScrollText,
    },
    {
      id: "appeal-support",
      title: "Appeal Support",
      subtitle: "Dispute escalation",
      caption: "Appeal filing and documentation workflow.",
      icon: BriefcaseBusiness,
    },
    {
      id: "ca-certification",
      title: "CA Certification",
      subtitle: "Certified declarations",
      caption: "Chartered accountant certificate coordination.",
      icon: Building2,
    },
  ],
  "iso-trademark": [
    {
      id: "iso",
      title: "ISO Certification",
      subtitle: "Quality certification",
      caption: "ISO documentation and audit coordination.",
      icon: FileCheck2,
    },
    {
      id: "trademark",
      title: "Trademark Filing",
      subtitle: "Brand filing support",
      caption: "Trademark search, filing, and tracking workflow.",
      icon: Stamp,
    },
    {
      id: "brand-protection",
      title: "Brand Protection",
      subtitle: "IP protection support",
      caption: "Monitoring and response support for brand assets.",
      icon: ShieldCheck,
    },
    {
      id: "audit-support",
      title: "Audit Support",
      subtitle: "Certification readiness",
      caption: "Document readiness and gap review.",
      icon: ClipboardList,
    },
  ],
  logistics: [
    {
      id: "freight",
      title: "Freight Coordination",
      subtitle: "Shipment movement",
      caption: "Freight planning and coordination support.",
      icon: Truck,
    },
    {
      id: "port-operations",
      title: "Port Operations",
      subtitle: "Port handling support",
      caption: "Port process coordination and documentation.",
      icon: PackageCheck,
    },
    {
      id: "warehouse",
      title: "Warehouse Coordination",
      subtitle: "Storage workflow",
      caption: "Warehouse coordination and compliance support.",
      icon: Store,
    },
    {
      id: "shipment-tracking",
      title: "Shipment Tracking",
      subtitle: "Live movement updates",
      caption: "Tracking and exception management support.",
      icon: Globe,
    },
    {
      id: "documentation-desk",
      title: "Documentation Desk",
      subtitle: "Logistics paperwork",
      caption: "Shipping document review and preparation.",
      icon: FileSpreadsheet,
    },
  ],
};

function slugifySegment(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SERVICE_STORE_SEGMENT_ALIASES = {
  coo: "certificate-of-origin",
  "certificate-origin": "certificate-of-origin",
  "origin-certificate": "certificate-of-origin",
  certificateoforigin: "certificate-of-origin",
  iem: "iem-registration",
  "industrial-licence": "industrial-license",
  "wpc-licence": "wpc-license",
  "warehouse-licence": "warehouse-license",
  "epr-authorisation": "epr-authorization",
  "licensing-incentive": "licensing",
  "customs-portops": "logistics",
  "legal-audit": "dispute-resolution",
  "regulatory-bis": "registration",
};

function normalizeServiceStoreSegment(segment) {
  const slug = slugifySegment(segment);

  if (!slug) {
    return "";
  }

  return SERVICE_STORE_SEGMENT_ALIASES[slug] || slug;
}

function mapPathToState(pathname, categories, complianceServices, serviceGroups) {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const serviceStoreIndex = parts.indexOf("service-store");

  if (serviceStoreIndex === -1) {
    return {
      categoryId: null,
      serviceId: null,
    };
  }

  const categorySegment = normalizeServiceStoreSegment(
    parts[serviceStoreIndex + 1],
  );
  const serviceSegment = normalizeServiceStoreSegment(
    parts[serviceStoreIndex + 2],
  );
  const findComplianceService = (segment) => {
    const normalizedSegment = normalizeServiceStoreSegment(segment);

    if (!normalizedSegment) {
      return null;
    }

    const exactMatch = complianceServices.find((service) =>
      service.aliases.some(
        (alias) => normalizeServiceStoreSegment(alias) === normalizedSegment,
      ),
    );

    if (exactMatch) {
      return exactMatch;
    }

    return complianceServices.find((service) =>
      service.aliases.some((alias) => {
        const normalizedAlias = normalizeServiceStoreSegment(alias);

        return (
          normalizedAlias.startsWith(`${normalizedSegment}-`) ||
          normalizedSegment.startsWith(`${normalizedAlias}-`)
        );
      }),
    );
  };

  if (categorySegment === "compliance") {
    const matchedService = findComplianceService(serviceSegment);

    return {
      categoryId: "compliance",
      serviceId: matchedService?.id || null,
    };
  }

  const directComplianceService = findComplianceService(categorySegment);

  if (directComplianceService) {
    return {
      categoryId: "compliance",
      serviceId: directComplianceService.id,
    };
  }

  const matchedCategory = categories.find(
    (category) => normalizeServiceStoreSegment(category.id) === categorySegment,
  );

  if (matchedCategory) {
    const categoryServices = serviceGroups[matchedCategory.id] || [];
    const matchedService = categoryServices.find(
      (service) => normalizeServiceStoreSegment(service.id) === serviceSegment,
    );

    return {
      categoryId: matchedCategory.id,
      serviceId: matchedService?.id || null,
    };
  }

  return {
    categoryId: null,
    serviceId: null,
  };
}

function CategoryCard({ category, onSelect }) {
  const Icon = category.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(category)}
      className={`rounded-[30px] border p-7 text-left transition-all duration-300 ${
        category.available
          ? "border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] hover:-translate-y-0.5 hover:border-[#2952ff] hover:shadow-[0_24px_48px_rgba(41,82,255,0.10)]"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          category.available
            ? "bg-[#eef3ff] text-[#2952ff]"
            : "bg-white text-slate-300"
        }`}
      >
        <Icon size={24} />
      </div>
      <p className="mt-6 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
        {category.eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">
        {category.title}
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
        {category.description}
      </p>
      <div className="mt-8 flex items-center justify-between">
        <span
          className={`text-[11px] font-black uppercase tracking-[0.18em] ${
            category.available ? "text-[#2952ff]" : "text-slate-400"
          }`}
        >
          {category.available ? "Open Category" : "Coming Soon"}
        </span>
        <ArrowRight
          size={18}
          className={category.available ? "text-[#2952ff]" : "text-slate-300"}
        />
      </div>
    </button>
  );
}

function ComplianceServiceCard({ service, isSelected, onSelect }) {
  const Icon = service.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className={`min-h-[220px] rounded-[34px] border p-7 text-left transition-all duration-300 ${
        isSelected
          ? "border-[#2952ff] bg-white shadow-[0_24px_45px_rgba(41,82,255,0.12)]"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#2952ff] hover:shadow-[0_24px_45px_rgba(41,82,255,0.10)]"
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-3xl ${
          isSelected
            ? "bg-[#eef3ff] text-[#2952ff]"
            : "bg-slate-50 text-slate-400"
        }`}
      >
        <Icon size={28} />
      </div>
      <h3 className="mt-8 text-3xl font-black tracking-tight text-slate-900">
        {service.title}
      </h3>
      <p className="mt-3 text-sm font-semibold text-[#2952ff]">
        {service.subtitle}
      </p>
      <p className="mt-2 text-sm text-slate-500">{service.caption}</p>
      <div className="mt-10 flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#2952ff]">
          Click Here
        </span>
        <ArrowRight size={18} className="text-[#2952ff]" />
      </div>
    </button>
  );
}

function CategoryServiceCard({ service, onSelect }) {
  const Icon = service.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(service)}
      className="group flex min-h-[210px] flex-col justify-between rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-[0_16px_44px_rgba(15,23,42,0.045)] transition-all hover:-translate-y-1 hover:border-[#b9c8ff] hover:shadow-[0_24px_54px_rgba(41,82,255,0.12)]"
    >
      <div>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400 transition group-hover:bg-[#eef3ff] group-hover:text-[#2952ff]">
          <Icon size={26} />
        </div>
        <h3 className="mt-7 text-2xl font-black tracking-tight text-slate-950">
          {service.title}
        </h3>
        <p className="mt-3 text-sm font-bold text-[#2952ff]">
          {service.subtitle}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {service.caption}
        </p>
      </div>
      <div className="mt-6 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.22em] text-[#2952ff]">
        Click Here
        <ArrowRight
          size={20}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </button>
  );
}

function CertificateOfOriginWorkflow({ service, onBack }) {
  const navigate = useNavigate();
  const [certType, setCertType] = useState("non-preferential");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [issuingAgency, setIssuingAgency] = useState("");
  const [agreement, setAgreement] = useState("");
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [configuration, setConfiguration] = useState(null);
  const [quote, setQuote] = useState(null);
  const [requestId, setRequestId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingDocumentId, setUploadingDocumentId] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [resumedDraftCode, setResumedDraftCode] = useState("");
  const [ledger, setLedger] = useState({ balances: null, transactions: [] });
  const [files, setFiles] = useState({
    invoice: { status: "Not Uploaded", name: null },
    packingList: { status: "Not Uploaded", name: null },
    costSheet: { status: "Not Uploaded", name: null },
    bol: { status: "Not Uploaded", name: null },
    mfgDecl: { status: "Not Uploaded", name: null },
  });

  useEffect(() => {
    if (!showSavedMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShowSavedMessage(false), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [showSavedMessage]);

  useEffect(() => {
    let active = true;

    Promise.all([
      getCertificateOfOriginConfiguration(),
      getCertificateOfOriginRequests(),
      getCertificateOfOriginLedger(),
    ])
      .then(([data, requestData, ledgerData]) => {
        if (active) {
          setConfiguration(data);
          setLedger(ledgerData);
          setLoadError("");
          const draft = requestData.requests?.find(
            (request) => request.status === "DRAFT",
          );

          if (draft) {
            const payload = draft.payload || {};
            setRequestId(draft.id);
            setResumedDraftCode(draft.request_code);
            setCertType(payload.certificateType || "non-preferential");
            setInvoiceNumber(payload.invoiceNumber || "");
            setDestination(payload.destinationCountry || "");
            setIssuingAgency(payload.issuingAgency || "");
            setAgreement(payload.agreement || "");
            setFiles((currentFiles) => {
              const restoredFiles = { ...currentFiles };
              for (const document of draft.documents || []) {
                restoredFiles[document.documentKey] = {
                  status: "Uploaded",
                  name: document.name,
                  size: Number(document.size || 0),
                };
              }
              return restoredFiles;
            });
          }
        }
      })
      .catch(() => {
        if (active) {
          setLoadError(
            "Unable to load Certificate of Origin service configuration.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getCertificateOfOriginQuote(certType)
      .then((data) => {
        if (active) setQuote(data);
      })
      .catch(() => {
        if (active) setLoadError("Unable to calculate the service pricing.");
      });

    return () => {
      active = false;
    };
  }, [certType]);

  const serviceConfig = configuration?.service;
  const costs = quote || {
    officialFee: 0,
    serviceCharge: 0,
    gst: 0,
    total: 0,
    openingWalletBalance: 0,
    closingWalletBalance: 0,
    currentCreditLimit: 0,
    availableCreditAfter: 0,
  };
  const walletBalance = costs.openingWalletBalance;
  const creditLineBalance = costs.currentCreditLimit;
  const totalDeduction = costs.total;
  const walletAfter = costs.closingWalletBalance;
  const creditAfter = costs.availableCreditAfter;

  const buildRequestPayload = () => ({
    requestId,
    certificateType: certType,
    invoiceNumber,
    destinationCountry: destination,
    issuingAgency,
    agreement,
    documents: files,
  });

  const ensureDraft = async () => {
    if (requestId) return requestId;
    const data = await saveCertificateOfOriginDraft(buildRequestPayload());
    setRequestId(data.request.id);
    setResumedDraftCode(data.request.request_code);
    return data.request.id;
  };

  const handleFileSelection = async (documentId, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      setUploadingDocumentId(documentId);
      const draftId = await ensureDraft();
      const data = await uploadCertificateOfOriginDocument(
        draftId,
        documentId,
        file,
      );
      setFiles((currentFiles) => ({
        ...currentFiles,
        [documentId]: {
          status: data.document.status,
          name: data.document.name,
          size: data.document.size,
        },
      }));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text:
          error.response?.data?.message ||
          "The selected document could not be uploaded.",
        confirmButtonColor: "#2952ff",
      });
    } finally {
      setUploadingDocumentId(null);
    }
  };

  const handleRemoveFile = async (documentId) => {
    if (!requestId) return;
    try {
      setUploadingDocumentId(documentId);
      await removeCertificateOfOriginDocument(requestId, documentId);
      setFiles((currentFiles) => ({
        ...currentFiles,
        [documentId]: { status: "Not Uploaded", name: null },
      }));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to remove document",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#2952ff",
      });
    } finally {
      setUploadingDocumentId(null);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      const data = await saveCertificateOfOriginDraft(buildRequestPayload());
      setRequestId(data.request.id);
      setResumedDraftCode(data.request.request_code);
      setShowSavedMessage(true);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Unable to save draft",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#2952ff",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Swal.fire({
        icon: "info",
        title: "Complete Information",
        text: "Fill the required fields and upload the mandatory documents to continue.",
        confirmButtonColor: "#2952ff",
      });
      return;
    }

    try {
      setIsSaving(true);
      const data = await submitCertificateOfOrigin(buildRequestPayload());
      setRequestId(data.request.id);
      setResumedDraftCode("");
      const [quoteData, ledgerData] = await Promise.all([
        getCertificateOfOriginQuote(certType),
        getCertificateOfOriginLedger(),
      ]);
      setQuote(quoteData);
      setLedger(ledgerData);
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
        title: "Request submitted",
        text: `${data.request.request_code} has been sent for processing.`,
        confirmButtonColor: "#2952ff",
      });
    } catch (error) {
      const balanceCode = error.response?.data?.errors?.code;
      if (error.response?.status === 402 && balanceCode) {
        const messages = {
          INSUFFICIENT_WALLET:
            "Wallet balance is insufficient. Please top up your Wallet to continue.",
          INSUFFICIENT_CREDIT_LINE:
            "Credit Line balance is insufficient. Please top up your Credit Line to continue.",
          INSUFFICIENT_WALLET_AND_CREDIT_LINE:
            "Wallet and Credit Line balances are insufficient. Please top up both before continuing.",
        };
        const result = await Swal.fire({
          icon: "warning",
          title: "Top up required",
          text: messages[balanceCode] || "Available balance is insufficient.",
          showCancelButton: true,
          confirmButtonText: "Go to Wallet & Credit",
          cancelButtonText: "Stay here",
          confirmButtonColor: "#2952ff",
        });
        if (result.isConfirmed) {
          navigate("/client/wallet-credit#add-credit");
        }
        return;
      }

      Swal.fire({
        icon: "error",
        title: "Unable to submit request",
        text: error.response?.data?.message || "Please try again.",
        confirmButtonColor: "#2952ff",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid =
    invoiceNumber &&
    destination &&
    issuingAgency &&
    files.invoice.status === "Uploaded" &&
    files.packingList.status === "Uploaded" &&
    (certType === "non-preferential" ||
      (agreement &&
        files.mfgDecl.status === "Uploaded" &&
        files.costSheet.status === "Uploaded"));

  const documentFields = (serviceConfig?.documents || [])
    .filter(
      (field) => field.id === "bol" || field.requiredFor?.includes(certType),
    )
    .map((field) => ({
      ...field,
      req: field.requiredFor?.includes(certType),
      sample: field.sampleAvailable,
    }));

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        {loadError ? (
          <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {loadError}
          </div>
        ) : null}
        {showSavedMessage ? (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-2xl">
            <CheckCircle2 className="text-green-400" size={18} />
            <div>
              <p className="text-xs font-bold">Draft Saved Successfully</p>
              <p className="text-[11px] text-slate-400">
                You can resume this from your pending tasks later.
              </p>
            </div>
          </div>
        ) : null}
        {resumedDraftCode && !showSavedMessage ? (
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
            <Save size={17} />
            <div>
              <p className="text-xs font-bold">
                Draft {resumedDraftCode} restored
              </p>
              <p className="text-[11px] text-blue-700">
                Continue where you left off. This request remains editable until
                submission.
              </p>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_22px_60px_rgba(15,23,42,0.06)]">
          <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-100">
                <FileText size={22} />
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#2952ff]"
                >
                  <ArrowLeft size={16} />
                  Back to Compliance
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-slate-900 md:text-xl">
                    {serviceConfig?.name || service.title}
                  </h1>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                    {serviceConfig?.transactionType}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    {serviceConfig?.standard}
                  </p>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <div className="flex items-center gap-1 text-amber-600">
                    <Zap size={11} fill="currentColor" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      Priority SLA Applies
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onBack}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-1">
                {(serviceConfig?.certificateTypes || []).map((type, index) => {
                  const TypeIcon = index === 0 ? Globe : Scale;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setCertType(type.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all ${
                        certType === type.id
                          ? "border border-blue-100 bg-white text-blue-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <TypeIcon size={18} />
                      <span className="text-sm font-bold tracking-tight">
                        {type.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    placeholder={serviceConfig?.invoicePlaceholder || ""}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-600"
                    value={invoiceNumber}
                    onChange={(event) => setInvoiceNumber(event.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Issuing Agency
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-600"
                      value={issuingAgency}
                      onChange={(event) => setIssuingAgency(event.target.value)}
                    >
                      <option value="">Select Chamber/Agency...</option>
                      {(serviceConfig?.issuingAgencies || []).map((agency) => (
                        <option key={agency.value} value={agency.value}>
                          {agency.label}
                        </option>
                      ))}
                    </select>
                    <Building2
                      className="pointer-events-none absolute right-3 top-3 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Destination Country
                  </label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-blue-600"
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                    >
                      <option value="">Select country...</option>
                      {(serviceConfig?.destinationCountries || []).map(
                        (country) => (
                          <option key={country.value} value={country.value}>
                            {country.label}
                          </option>
                        ),
                      )}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-3 text-slate-400"
                      size={16}
                    />
                  </div>
                </div>
              </div>

              {certType === "preferential" ? (
                <div className="space-y-1.5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <label className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-blue-700">
                    FTA Agreement Framework
                  </label>
                  <select
                    className="w-full appearance-none rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-900 outline-none"
                    value={agreement}
                    onChange={(event) => setAgreement(event.target.value)}
                  >
                    <option value="">Select FTA Framework...</option>
                    {(serviceConfig?.ftaAgreements || []).map((fta) => (
                      <option key={fta.value} value={fta.value}>
                        {fta.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-800">
                    <Upload size={14} />
                    Supporting Documents
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {documentFields.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-lg p-2 ${
                            files[doc.id].status === "Uploaded"
                              ? "bg-green-100 text-green-600"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {doc.label}
                            </span>
                            {doc.req ? (
                              <span className="text-[9px] font-black uppercase text-red-500">
                                Required
                              </span>
                            ) : null}
                            {doc.sample ? (
                              <button
                                type="button"
                                className="flex items-center gap-1 text-[9px] font-bold text-blue-600 underline decoration-blue-200 underline-offset-2 hover:text-blue-800"
                              >
                                <Download size={10} />
                                Sample Template
                              </button>
                            ) : null}
                          </div>
                          <span
                            className={`text-[10px] ${
                              files[doc.id].status === "Uploaded"
                                ? "font-bold text-green-600"
                                : "text-slate-400"
                            }`}
                          >
                            {files[doc.id].name || "File not attached"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        {files[doc.id].status === "Uploaded" ? (
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(doc.id)}
                            disabled={uploadingDocumentId === doc.id}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase text-rose-600 disabled:opacity-60"
                          >
                            Remove
                          </button>
                        ) : null}
                        <label
                          className={`cursor-pointer rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase transition-all ${
                            files[doc.id].status === "Uploaded"
                              ? "border-green-200 bg-green-50 text-green-600"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                        >
                          {uploadingDocumentId === doc.id
                            ? "Uploading..."
                            : files[doc.id].status === "Uploaded"
                              ? "Replace"
                              : "Attach File"}
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                            disabled={uploadingDocumentId === doc.id}
                            onChange={(event) =>
                              handleFileSelection(doc.id, event)
                            }
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative space-y-4 overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900 shadow-xl xl:sticky xl:top-24 xl:self-start">
              {!quote ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95 text-xs font-bold text-blue-300">
                  Loading transaction ledger…
                </div>
              ) : null}
              <div className="flex items-center justify-between border-b border-white/5 bg-slate-800/50 px-4 py-3">
                <div className="flex items-center gap-2 text-blue-400">
                  <Receipt size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    Transaction Ledger (INR)
                  </span>
                </div>
              </div>

              <div className="grid gap-5 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-white/40">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Prepaid Wallet
                    </span>
                    <Wallet size={14} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Opening Balance</span>
                      <span className="font-medium text-white">
                        ₹{walletBalance.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between border-y border-white/5 py-1.5 text-xs">
                      <span className="text-slate-400">Official Fees</span>
                      <span className="font-bold text-red-400">
                        - ₹{costs.officialFee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                        Closing Balance
                      </span>
                      <span className="text-sm font-black text-white">
                        ₹{walletAfter.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-white/40">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Corporate Credit Line
                    </span>
                    <CreditCard size={14} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Current Limit</span>
                      <span className="font-medium text-white">
                        ₹{creditLineBalance.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1.5 text-xs">
                      <span className="text-slate-400">Service Charges</span>
                      <span className="text-white">
                        ₹{costs.serviceCharge.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 text-xs">
                      <span className="font-bold text-slate-400">
                        GST (18%)
                      </span>
                      <span className="font-bold text-red-400">
                        - ₹{costs.gst.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                        Available Post-Task
                      </span>
                      <span className="text-sm font-black text-white">
                        ₹{creditAfter.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-blue-600 px-5 py-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-blue-100/90">
                    Final Payable Amount
                  </p>
                  <p className="text-2xl font-black leading-none text-white">
                    ₹{totalDeduction.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-widest leading-tight text-white/60">
                    Fees strictly governed
                    <br />
                    by DGFT guidelines.
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 px-4 pb-4">
                <div className="mb-2 flex items-center justify-between pt-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Recent Transactions
                  </span>
                  <span className="text-[9px] font-bold text-slate-500">
                    {ledger.transactions.length} entries
                  </span>
                </div>
                <div className="max-h-32 space-y-2 overflow-y-auto custom-scrollbar">
                  {ledger.transactions.slice(0, 6).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="rounded-lg border border-white/5 bg-white/[0.04] p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-bold text-slate-200">
                          {transaction.serviceName}
                        </span>
                        <span className="text-[10px] font-black text-rose-400">
                          - ₹{transaction.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
                        <span>
                          {transaction.accountType === "WALLET"
                            ? "Wallet"
                            : "Credit Line"}{" "}
                          · {transaction.status}
                        </span>
                        <span>
                          {new Date(transaction.transactionDate).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!ledger.transactions.length ? (
                    <p className="py-3 text-center text-[10px] text-slate-500">
                      No transactions yet
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 md:flex-row md:items-center">
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 transition-colors hover:text-red-600"
            >
              Discard
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving || !serviceConfig}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                <Save size={16} className="text-slate-500" />
                {isSaving ? "Saving..." : "Save as Draft"}
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving || !isFormValid}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-black transition-all active:scale-95 ${
                  isFormValid
                    ? "bg-blue-700 text-white shadow-xl shadow-blue-200 hover:bg-blue-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-400"
                }`}
              >
                {isSaving
                  ? "Processing..."
                  : isFormValid
                    ? "Confirm & Process Payment"
                    : "Complete Information"}
                {isFormValid ? <ArrowRight size={16} /> : null}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UniversalServiceWorkflow({ service, category, onBack }) {
  const Icon = service.icon;
  const [activeMode, setActiveMode] = useState("standard");
  const [form, setForm] = useState({
    reference: "",
    entity: "",
    description: "",
  });
  const [documents, setDocuments] = useState({});

  const evidence = [
    {
      id: "application",
      label: "Signed application / request letter",
      required: true,
    },
    {
      id: "entity",
      label: "Entity and statutory supporting document",
      required: true,
    },
    {
      id: "supporting",
      label: "Additional supporting evidence",
      required: false,
    },
  ];

  const handleFile = (documentId, file) => {
    if (file) setDocuments((current) => ({ ...current, [documentId]: file }));
  };

  const saveDraft = () => {
    Swal.fire({
      icon: "success",
      title: "Draft saved",
      text: `${service.title} has been retained in this session.`,
      confirmButtonColor: "#2952ff",
    });
  };

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <article className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
          <header className="flex items-start justify-between gap-5 border-b border-slate-100 px-5 py-5 md:px-6">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#2952ff] text-white shadow-lg shadow-blue-200">
                <Icon size={25} />
              </div>
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#2952ff]"
                >
                  <ArrowLeft size={16} /> Back to {category.title}
                </button>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-black uppercase tracking-tight text-slate-950 md:text-2xl">
                    {service.title}
                  </h1>
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white">
                    Managed service
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <span>{category.eyebrow}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-amber-600">
                    Priority processing available
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              aria-label="Close service"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </header>

          <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-5">
              <div className="grid rounded-2xl bg-slate-100 p-1 sm:grid-cols-2">
                {[
                  ["standard", "Standard filing", "Complete service workflow"],
                  ["assisted", "Assisted review", "Expert-led preparation"],
                ].map(([id, title, subtitle]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveMode(id)}
                    className={`rounded-xl px-4 py-3 text-center transition ${activeMode === id ? "border border-blue-200 bg-white text-[#2952ff] shadow-sm" : "text-slate-400"}`}
                  >
                    <span className="block text-xs font-black uppercase">
                      {title}
                    </span>
                    <span className="mt-1 block text-[9px] font-semibold uppercase">
                      {subtitle}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Application / reference number
                  </span>
                  <input
                    value={form.reference}
                    onChange={(e) =>
                      setForm({ ...form, reference: e.target.value })
                    }
                    placeholder="Enter reference number"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2952ff] focus:ring-4 focus:ring-blue-50"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Entity / branch
                  </span>
                  <input
                    value={form.entity}
                    onChange={(e) =>
                      setForm({ ...form, entity: e.target.value })
                    }
                    placeholder="Select or enter entity"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2952ff] focus:ring-4 focus:ring-blue-50"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Request details
                </span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  placeholder={service.caption}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#2952ff] focus:ring-4 focus:ring-blue-50"
                />
              </label>

              <section>
                <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Upload size={15} />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900">
                    Required supporting evidence
                  </h2>
                </div>
                <div className="space-y-2">
                  {evidence.map((item) => {
                    const file = documents[item.id];
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${file ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}
                          >
                            <FileText size={17} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black text-slate-800">
                              {item.label}{" "}
                              {item.required && (
                                <span className="ml-1 text-[9px] text-rose-500">
                                  REQUIRED
                                </span>
                              )}
                            </p>
                            <p
                              className={`mt-1 truncate text-[10px] ${file ? "font-semibold text-emerald-600" : "text-slate-400"}`}
                            >
                              {file?.name || "Awaiting document upload"}
                            </p>
                          </div>
                        </div>
                        <label className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-5 py-2 text-center text-[10px] font-black uppercase text-slate-700 hover:border-[#2952ff] hover:text-[#2952ff]">
                          {file ? "Replace" : "Upload"}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) =>
                              handleFile(item.id, e.target.files?.[0])
                            }
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <aside className="h-fit overflow-hidden rounded-[26px] bg-[#10192d] text-white shadow-[0_20px_45px_rgba(15,23,42,0.22)]">
              <div className="border-b border-white/10 px-5 py-4">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-blue-400">
                  <Receipt size={15} /> Transaction ledger (INR)
                </p>
              </div>
              <div className="space-y-5 px-5 py-5 text-xs">
                <div>
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Prepaid wallet
                  </p>
                  <div className="flex justify-between border-b border-white/10 pb-3 text-slate-400">
                    <span>Official / statutory fee</span>
                    <span className="font-bold text-white">
                      Calculated on review
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-3 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                    Corporate credit line
                  </p>
                  <div className="flex justify-between border-b border-white/10 pb-3 text-slate-400">
                    <span>Professional charges</span>
                    <span className="font-bold text-white">
                      Calculated on review
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-[11px] leading-5 text-blue-100">
                  Your balances are validated by the backend before final
                  submission. No amount is deducted while saving a draft.
                </div>
              </div>
              <div className="bg-[#2952ff] px-5 py-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-100">
                  Estimated payable
                </p>
                <p className="mt-1 text-xl font-black">Pending quotation</p>
              </div>
            </aside>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <button
              type="button"
              onClick={onBack}
              className="text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500"
            >
              Discard
            </button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={saveDraft}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <Save size={16} /> Save as Draft
              </button>
              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    icon: "info",
                    title: "Request ready for review",
                    text: "Complete service pricing and submission will be enabled when this service API is configured.",
                    confirmButtonColor: "#2952ff",
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2952ff] px-7 py-3 text-sm font-black text-white shadow-lg shadow-blue-200"
              >
                Continue to review <ArrowRight size={16} />
              </button>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}

function ComplianceServiceDetailView({ service, category, onBack }) {
  if (service.id === "certificate-of-origin") {
    return <CertificateOfOriginWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "iem-registration") {
    return <IemRegistrationWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "industrial-licence") {
    return <IndustrialLicenseWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "wpc-licence") {
    return <WpcEtaWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "epcg") {
    return <EpcgWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "igcr-return") {
    return <IgcrReturnWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "pollution-control") {
    return <PollutionControlWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "ca-certification") {
    return <CaCertificationWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "lmpc") {
    return <LmpcWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "epr-authorisation") {
    return <EprAuthorizationWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "un-iip-certificate") {
    return <UnIipPackagingAuditWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "gst-return") {
    return <GstReturnsAuditWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "gst-lut-filing") {
    return <GstLutUndertakingWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "cdsco-drug-control") {
    return (
      <CdscoImportAuthorizationWorkflow service={service} onBack={onBack} />
    );
  }
  if (service.id === "aqcs-pqms") {
    return <AqcsPqmsWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "warehouse-license") {
    return <WarehouseLicenseWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "factory-license") {
    return <FactoryLicenseWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "fssai") {
    return <FssaiWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "rex") {
    return <RexRegistrationWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "bis") {
    return <BisRegistrationWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "dsc-services") {
    return <DscServicesWorkflow service={service} onBack={onBack} />;
  }
  if (service.id === "ebrc") {
    return <EbrcWorkflow service={service} onBack={onBack} />;
  }

  return (
    <UniversalServiceWorkflow
      service={service}
      category={category}
      onBack={onBack}
    />
  );
}

export default function ServiceStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState("");
  const [expandedCategoryId, setExpandedCategoryId] = useState("compliance");
  const [serviceQuery, setServiceQuery] = useState("");

  useEffect(() => {
    let active = true;
    getServiceStoreCatalog()
      .then((payload) => {
        if (active) setCatalog(payload);
      })
      .catch(() => {
        if (active) setCatalogError("Unable to load the Service Store catalog.");
      });
    return () => {
      active = false;
    };
  }, []);

  const iconByKey = useMemo(() => ({
    "shield-check": ShieldCheck, landmark: Landmark, building: Building2,
    wallet: Wallet, "file-text": FileText, scale: Scale,
    "badge-check": FileCheck2, truck: Truck, factory: Factory, shield: Shield,
    leaf: Leaf, globe: Globe, store: Store, receipt: Receipt,
    stamp: Stamp, boxes: Boxes, package: PackageCheck, upload: Upload,
    "credit-card": CreditCard, radio: Radio, folder: BriefcaseBusiness
  }), []);

  const SERVICE_STORE_CATEGORIES = useMemo(
    () => (catalog?.categories || []).map((category) => ({
      ...category,
      available: true,
      icon: iconByKey[category.iconKey] || BriefcaseBusiness,
      services: (category.services || []).map((service) => ({
        ...service,
        aliases: [service.id],
        icon: iconByKey[service.iconKey] || FileText
      }))
    })),
    [catalog, iconByKey]
  );
  const COMPLIANCE_SERVICES = useMemo(
    () => SERVICE_STORE_CATEGORIES.find((category) => category.id === "compliance")?.services || [],
    [SERVICE_STORE_CATEGORIES]
  );
  const CATEGORY_SERVICE_GROUPS = useMemo(
    () => Object.fromEntries(SERVICE_STORE_CATEGORIES.map((category) => [category.id, category.services || []])),
    [SERVICE_STORE_CATEGORIES]
  );
  const { categoryId, serviceId } = useMemo(
    () => mapPathToState(location.pathname, SERVICE_STORE_CATEGORIES, COMPLIANCE_SERVICES, CATEGORY_SERVICE_GROUPS),
    [location.pathname, SERVICE_STORE_CATEGORIES, COMPLIANCE_SERVICES, CATEGORY_SERVICE_GROUPS],
  );

  const selectedComplianceServiceId = serviceId || null;

  const selectedCategory = SERVICE_STORE_CATEGORIES.find(
    (category) => category.id === categoryId,
  );
  const selectedService = COMPLIANCE_SERVICES.find(
    (service) => service.id === selectedComplianceServiceId,
  );
  const selectedCategoryService =
    selectedCategory?.id !== "compliance"
      ? (CATEGORY_SERVICE_GROUPS[selectedCategory?.id] || []).find(
          (service) => service.id === serviceId,
        )
      : null;

  const handleServiceSelect = (service) => {
    navigate(`/client/service-store/compliance/${service.id}`);
  };

  const handleCategoryServiceSelect = (service) => {
    const categoryPath = selectedCategory?.path || "/client/service-store";
    navigate(`${categoryPath}/${service.id}`);
  };

  const openSelectedComplianceService = () => {
    if (!selectedService) {
      return;
    }

    navigate(`/client/service-store/compliance/${selectedService.id}`);
  };

  const goToRoot = () => {
    navigate("/client/service-store");
  };

  const getCategoryServices = (categoryIdValue) =>
    categoryIdValue === "compliance"
      ? COMPLIANCE_SERVICES
      : CATEGORY_SERVICE_GROUPS[categoryIdValue] || [];

  const openAccordionService = (category, service) => {
    navigate(`${category.path}/${service.id}`);
  };

  if (!catalog && !catalogError) {
    return <div className="dashboard-page flex min-h-[420px] items-center justify-center text-sm font-bold text-slate-500">Loading Service Store…</div>;
  }

  if (catalogError) {
    return <div className="dashboard-page flex min-h-[420px] items-center justify-center text-sm font-bold text-rose-600">{catalogError}</div>;
  }

  if (selectedCategory?.id === "compliance" && selectedService) {
    return (
      <ComplianceServiceDetailView
        service={selectedService}
        category={selectedCategory}
        onBack={goToRoot}
      />
    );
  }

  if (selectedCategoryService) {
    return (
      <UniversalServiceWorkflow
        service={selectedCategoryService}
        category={selectedCategory}
        onBack={() => navigate(selectedCategory.path)}
      />
    );
  }

  if (selectedCategory?.id === "compliance") {
    return (
      <div className="min-h-[calc(100vh-7rem)]">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
          <div className="rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <div className="px-6 py-6 md:px-8">
              <button
                type="button"
                onClick={goToRoot}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#101eb9]"
              >
                <ArrowLeft size={16} />
                Back to Categories
              </button>

              <div className="mt-8">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
                  Trade Governance
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  COMPLIANCE
                </h1>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.22em] text-[#2952ff]/55">
                  Filing, Certification, and Documentation Services
                </p>
                <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-500">
                  This screen now acts as the parent Compliance view. All
                  submenu services are surfaced here so users can browse and
                  select them from one place.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {COMPLIANCE_SERVICES.map((service) => (
                  <ComplianceServiceCard
                    key={service.id}
                    service={service}
                    isSelected={selectedComplianceServiceId === service.id}
                    onSelect={handleServiceSelect}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
              <button
                type="button"
                onClick={goToRoot}
                className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 transition hover:text-rose-500"
              >
                Exit Category
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    Swal.fire({
                      icon: "success",
                      title: "Draft saved",
                      text: "Your Compliance service selection has been saved for later.",
                      confirmButtonColor: "#2952ff",
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-4 text-sm font-black text-slate-700 shadow-sm"
                >
                  <Save size={16} />
                  Save Draft
                </button>

                <button
                  type="button"
                  onClick={openSelectedComplianceService}
                  disabled={!selectedComplianceServiceId}
                  className={`inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-black transition-all ${
                    selectedComplianceServiceId
                      ? "bg-[#2952ff] text-white shadow-xl shadow-blue-200"
                      : "cursor-not-allowed bg-slate-200 text-slate-400"
                  }`}
                >
                  Select a Service
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    const categoryServices = CATEGORY_SERVICE_GROUPS[selectedCategory.id] || [];

    return (
      <div className="min-h-[calc(100vh-7rem)]">
        <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
          <div className="rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <div className="px-6 py-6 md:px-8">
              <button
                type="button"
                onClick={goToRoot}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#101eb9]"
              >
                <ArrowLeft size={16} />
                Back to Parent Menus
              </button>

              <div className="mt-8">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
                  {selectedCategory.eyebrow}
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  {selectedCategory.title}
                </h1>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.22em] text-[#2952ff]/55">
                  {selectedCategory.description}
                </p>
                <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-500">
                  Select a service from this category to continue with the
                  workflow.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categoryServices.map((service) => (
                  <CategoryServiceCard
                    key={service.id}
                    service={service}
                    onSelect={handleCategoryServiceSelect}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="service-store-shell">
        <div className="service-store-heading">
          <div>
            <p className="premium-kicker">Services available</p>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950 md:text-3xl">
              Apply for services
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Select a category below to view and start its available services.
            </p>
          </div>
          <label className="service-store-search">
            <Search size={16} />
            <input
              value={serviceQuery}
              onChange={(event) => setServiceQuery(event.target.value)}
              placeholder="Search services"
              aria-label="Search services"
            />
          </label>
        </div>

        <div className="service-store-scroll custom-scrollbar">
          <div className="space-y-2.5">
            {SERVICE_STORE_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const services = getCategoryServices(category.id).filter(
                (service) =>
                  `${service.title} ${service.subtitle || ""}`
                    .toLowerCase()
                    .includes(serviceQuery.trim().toLowerCase()),
              );
              const isExpanded = expandedCategoryId === category.id;

              if (serviceQuery && services.length === 0) {
                return null;
              }

              return (
                <article
                  key={category.id}
                  className={`service-accordion ${isExpanded ? "is-expanded" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCategoryId((current) =>
                        current === category.id ? null : category.id,
                      )
                    }
                    className="service-accordion-trigger"
                    aria-expanded={isExpanded}
                  >
                    <span className="service-category-icon">
                      <Icon size={19} />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-sm font-extrabold text-slate-900 md:text-[15px]">
                        {category.title}
                      </span>
                      <span className="mt-0.5 hidden truncate text-[11px] text-slate-500 sm:block">
                        {category.eyebrow}
                      </span>
                    </span>
                    <span className="mr-2 hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 sm:block">
                      {services.length} services
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-[#3157ff]" : ""
                      }`}
                    />
                  </button>

                  <div
                    className={`service-accordion-content ${isExpanded ? "is-open" : ""}`}
                  >
                    <div className="grid gap-2 border-t border-slate-200/70 p-3 sm:grid-cols-2 xl:grid-cols-3">
                      {services.map((service) => {
                        const ServiceIcon = service.icon || FileText;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() =>
                              openAccordionService(category, service)
                            }
                            className="service-list-item"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3157ff]">
                              <ServiceIcon size={17} />
                            </span>
                            <span className="min-w-0 flex-1 text-left">
                              <span className="block truncate text-xs font-bold text-slate-800">
                                {service.title}
                              </span>
                              <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                                {service.subtitle}
                              </span>
                            </span>
                            <ChevronRight
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                          </button>
                        );
                      })}
                      {!services.length ? (
                        <p className="col-span-full px-3 py-5 text-center text-xs text-slate-400">
                          No services match your search.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
