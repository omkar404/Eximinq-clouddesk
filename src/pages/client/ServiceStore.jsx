import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
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
  Zap
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
    available: true
  },
  {
    id: "licensing",
    path: "/client/service-store/licensing",
    title: "Licensing",
    eyebrow: "Authorisations and Permissions",
    description:
      "Structured licensing workflows and approval-led service requests.",
    icon: Landmark,
    available: true
  },
  {
    id: "registration",
    path: "/client/service-store/registration",
    title: "Registration",
    eyebrow: "Entity and Filing Setup",
    description:
      "Registration-oriented services for regulated business onboarding.",
    icon: BriefcaseBusiness,
    available: true
  },
  {
    id: "incentives",
    path: "/client/service-store/incentives",
    title: "Incentives",
    eyebrow: "Benefits and Claims",
    description:
      "Incentive-oriented workflows and claim-linked support services.",
    icon: ReceiptText,
    available: true
  },
  {
    id: "custom-filing",
    path: "/client/service-store/custom-filing",
    title: "Custom Filing",
    eyebrow: "Trade Documentation",
    description:
      "Custom filing and documentation support across governed submissions.",
    icon: FileSpreadsheet,
    available: true
  },
  {
    id: "dispute-resolution",
    path: "/client/service-store/dispute-resolution",
    title: "Dispute Resolution",
    eyebrow: "Remedy and Response",
    description:
      "Resolution-led workflows for notices, disputes, and response handling.",
    icon: Shield,
    available: true
  },
  {
    id: "iso-trademark",
    path: "/client/service-store/iso-trademark",
    title: "ISO & Trademark",
    eyebrow: "Certification and Protection",
    description:
      "Quality system and mark protection categories under one parent menu.",
    icon: Stamp,
    available: true
  },
  {
    id: "logistics",
    path: "/client/service-store/logistics",
    title: "Logistics",
    eyebrow: "Movement and Coordination",
    description:
      "Operational support for shipping, handling, and logistics activities.",
    icon: Globe,
    available: true
  }
];

const COMPLIANCE_SERVICES = [
  {
    id: "certificate-of-origin",
    title: "Certificate of Origin",
    subtitle: "Origin certification support",
    caption: "Chamber-certified export origin documentation workflow",
    icon: ScrollText,
    aliases: ["certificate-of-origin", "coo", "certificate-origin", "origin-certificate"]
  },
  {
    id: "iem-registration",
    title: "IEM Registration",
    subtitle: "Industrial entrepreneur filing",
    caption: "DPIIT and manufacturing setup support",
    icon: BriefcaseBusiness,
    aliases: ["iem-registration", "iem"]
  },
  {
    id: "industrial-licence",
    title: "Industrial Licence",
    subtitle: "Industrial approval workflow",
    caption: "Licensing support for controlled sectors",
    icon: Factory,
    aliases: ["industrial-licence", "industrial-license", "industrial"]
  },
  {
    id: "wpc-licence",
    title: "WPC Licence",
    subtitle: "Wireless planning compliance",
    caption: "WPC documentation and filing support",
    icon: Radio,
    aliases: ["wpc-licence", "wpc-license", "wpc"]
  },
  {
    id: "un-iip-certificate",
    title: "UN IIP Certificate",
    subtitle: "Hazard goods packaging compliance",
    caption: "UN certification and inspection workflow",
    icon: PackageCheck,
    aliases: ["un-iip-certificate", "un-iip", "uniip"]
  },
  {
    id: "gst-return",
    title: "GST Return",
    subtitle: "Periodic GST filing",
    caption: "Return preparation and submission support",
    icon: ReceiptText,
    aliases: ["gst-return", "gst-returns", "gstr"]
  },
  {
    id: "gst-lut-filing",
    title: "GST LUT Filing",
    subtitle: "LUT application and renewal",
    caption: "Export LUT filing support",
    icon: ScrollText,
    aliases: ["gst-lut-filing", "gst-lut", "lut"]
  },
  {
    id: "cdsco-drug-control",
    title: "CDSCO Drug Control",
    subtitle: "Drug and device regulatory compliance",
    caption: "Documentation for controlled product imports",
    icon: FileCheck2,
    aliases: ["cdsco-drug-control", "cdsco", "drug-control"]
  },
  {
    id: "aqcs-pqms",
    title: "AQCS & PQMS",
    subtitle: "Animal and plant quarantine compliance",
    caption: "Inspection, NOC, and quarantine documentation",
    icon: Waves,
    aliases: ["aqcs-pqms", "aqcs", "pqms"]
  },
  {
    id: "warehouse-license",
    title: "Warehouse License",
    subtitle: "Warehouse approval and registration",
    caption: "Bonded and operational warehouse support",
    icon: Store,
    aliases: ["warehouse-license", "warehouse-licence", "warehouse"]
  },
  {
    id: "dsc-services",
    title: "DSC Services",
    subtitle: "Digital signature support",
    caption: "Issuance, renewal, and usage coordination",
    icon: Stamp,
    aliases: ["dsc-services", "dsc"]
  },
  {
    id: "ebrc",
    title: "EBRC",
    subtitle: "Single eBRC generation support",
    caption: "Bank realisation certificate processing",
    icon: FileBadge2,
    aliases: ["ebrc"]
  },
  {
    id: "bulk-ebrc",
    title: "Bulk EBRC",
    subtitle: "Batch eBRC processing",
    caption: "High-volume certificate handling support",
    icon: Boxes,
    aliases: ["bulk-ebrc", "bulk-ebrcs"]
  },
  {
    id: "igcr-return",
    title: "IGCR Return",
    subtitle: "IGCR monthly compliance",
    caption: "Imported goods concession reporting support",
    icon: FileSpreadsheet,
    aliases: ["igcr-return", "igcr-returns", "igcr"]
  },
  {
    id: "pollution-control",
    title: "Pollution Control",
    subtitle: "CTE and CTO compliance",
    caption: "State pollution board documentation support",
    icon: Leaf,
    aliases: ["pollution-control", "pollution"]
  },
  {
    id: "ca-certification",
    title: "CA Certification",
    subtitle: "Certified financial declarations",
    caption: "Chartered accountant certificate coordination",
    icon: Building2,
    aliases: ["ca-certification", "ca-certificate", "ca"]
  },
  {
    id: "lmpc",
    title: "LMPC",
    subtitle: "Legal metrology compliance",
    caption: "Packaged commodity importer support",
    icon: Truck,
    aliases: ["lmpc", "legal-metrology"]
  },
  {
    id: "epr-authorisation",
    title: "EPR Authorisation",
    subtitle: "Extended producer responsibility",
    caption: "Waste and recycling compliance support",
    icon: Wrench,
    aliases: ["epr-authorisation", "epr-authorization", "epr"]
  }
];

const CATEGORY_SERVICE_GROUPS = {
  licensing: [
    { id: "advance-auth", title: "Advance Authorisation", subtitle: "DGFT authorisation workflow", caption: "End-to-end support for advance authorisation filing.", icon: FileCheck2 },
    { id: "epcg", title: "EPCG License", subtitle: "Capital goods licensing", caption: "Application, documentation, and closure support.", icon: Factory },
    { id: "star", title: "Star Export House", subtitle: "Exporter recognition", caption: "Status holder filing and supporting documentation.", icon: Globe },
    { id: "rex", title: "REX Registration", subtitle: "Exporter registration", caption: "REX onboarding and certification assistance.", icon: Stamp },
    { id: "iec", title: "IEC Services", subtitle: "Importer exporter code", caption: "IEC application, modification, and update support.", icon: Building2 }
  ],
  registration: [
    { id: "fssai", title: "FSSAI Registration", subtitle: "Food business compliance", caption: "Registration and licensing support for food imports.", icon: FileCheck2 },
    { id: "bis", title: "BIS Registration", subtitle: "Product certification", caption: "BIS documentation and registration workflow.", icon: ShieldCheck },
    { id: "cdsco", title: "CDSCO Registration", subtitle: "Drug and device onboarding", caption: "Regulatory registration support for controlled products.", icon: FileBadge2 },
    { id: "aqcs", title: "AQCS & PQMS", subtitle: "Quarantine registration", caption: "Animal and plant quarantine support.", icon: Waves },
    { id: "legal-metrology", title: "Legal Metrology", subtitle: "Packaged commodity setup", caption: "LMPC registration and documentation support.", icon: Scale }
  ],
  incentives: [
    { id: "rodtep", title: "RoDTEP Claims", subtitle: "Export remission benefits", caption: "Claim preparation and reconciliation support.", icon: ReceiptText },
    { id: "rosctl", title: "RoSCTL Claims", subtitle: "Textile incentive support", caption: "Scheme filing and claim documentation.", icon: Receipt },
    { id: "duty", title: "Duty Drawback", subtitle: "Refund processing", caption: "Drawback claim review and filing support.", icon: CreditCard },
    { id: "interest", title: "Interest Equalisation", subtitle: "Finance incentive", caption: "Eligibility review and claim assistance.", icon: Wallet },
    { id: "igst", title: "IGST Refund", subtitle: "Export tax refund", caption: "Refund tracking and filing support.", icon: Download }
  ],
  "custom-filing": [
    { id: "moowr", title: "MOOWR Filing", subtitle: "Warehouse manufacturing", caption: "MOOWR registration and filing workflow.", icon: Factory },
    { id: "dpd", title: "DPD Registration", subtitle: "Direct port delivery", caption: "DPD onboarding and documentation support.", icon: Truck },
    { id: "rmcc", title: "RMCC Support", subtitle: "Customs coordination", caption: "RMCC filing and response assistance.", icon: Shield },
    { id: "svb", title: "SVB Filing", subtitle: "Valuation branch support", caption: "SVB documentation and submission workflow.", icon: Scale },
    { id: "factory-stuffing", title: "Factory Stuffing", subtitle: "Export logistics filing", caption: "Permission and compliance documentation.", icon: PackageCheck }
  ],
  "dispute-resolution": [
    { id: "dgft-relaxation", title: "DGFT Relaxation", subtitle: "Policy relaxation request", caption: "Representation drafting and filing support.", icon: FileText },
    { id: "customs-defense", title: "Customs Defence", subtitle: "Customs notice support", caption: "Response and hearing documentation.", icon: Shield },
    { id: "scn-reply", title: "SCN Reply", subtitle: "Show cause response", caption: "Drafting, evidence mapping, and submission support.", icon: ScrollText },
    { id: "appeal-support", title: "Appeal Support", subtitle: "Dispute escalation", caption: "Appeal filing and documentation workflow.", icon: BriefcaseBusiness },
    { id: "ca-certification", title: "CA Certification", subtitle: "Certified declarations", caption: "Chartered accountant certificate coordination.", icon: Building2 }
  ],
  "iso-trademark": [
    { id: "iso", title: "ISO Certification", subtitle: "Quality certification", caption: "ISO documentation and audit coordination.", icon: FileCheck2 },
    { id: "trademark", title: "Trademark Filing", subtitle: "Brand filing support", caption: "Trademark search, filing, and tracking workflow.", icon: Stamp },
    { id: "brand-protection", title: "Brand Protection", subtitle: "IP protection support", caption: "Monitoring and response support for brand assets.", icon: ShieldCheck },
    { id: "audit-support", title: "Audit Support", subtitle: "Certification readiness", caption: "Document readiness and gap review.", icon: ClipboardList }
  ],
  logistics: [
    { id: "freight", title: "Freight Coordination", subtitle: "Shipment movement", caption: "Freight planning and coordination support.", icon: Truck },
    { id: "port-operations", title: "Port Operations", subtitle: "Port handling support", caption: "Port process coordination and documentation.", icon: PackageCheck },
    { id: "warehouse", title: "Warehouse Coordination", subtitle: "Storage workflow", caption: "Warehouse coordination and compliance support.", icon: Store },
    { id: "shipment-tracking", title: "Shipment Tracking", subtitle: "Live movement updates", caption: "Tracking and exception management support.", icon: Globe },
    { id: "documentation-desk", title: "Documentation Desk", subtitle: "Logistics paperwork", caption: "Shipping document review and preparation.", icon: FileSpreadsheet }
  ]
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
  "regulatory-bis": "registration"
};

function normalizeServiceStoreSegment(segment) {
  const slug = slugifySegment(segment);

  if (!slug) {
    return "";
  }

  return SERVICE_STORE_SEGMENT_ALIASES[slug] || slug;
}

function mapPathToState(pathname) {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  const serviceStoreIndex = parts.indexOf("service-store");

  if (serviceStoreIndex === -1) {
    return {
      categoryId: null,
      serviceId: null
    };
  }

  const categorySegment = normalizeServiceStoreSegment(parts[serviceStoreIndex + 1]);
  const serviceSegment = normalizeServiceStoreSegment(parts[serviceStoreIndex + 2]);
  const findComplianceService = (segment) => {
    const normalizedSegment = normalizeServiceStoreSegment(segment);

    if (!normalizedSegment) {
      return null;
    }

    const exactMatch = COMPLIANCE_SERVICES.find((service) =>
      service.aliases.some(
        (alias) => normalizeServiceStoreSegment(alias) === normalizedSegment
      )
    );

    if (exactMatch) {
      return exactMatch;
    }

    return COMPLIANCE_SERVICES.find((service) =>
      service.aliases.some((alias) => {
        const normalizedAlias = normalizeServiceStoreSegment(alias);

        return (
          normalizedAlias.startsWith(`${normalizedSegment}-`) ||
          normalizedSegment.startsWith(`${normalizedAlias}-`)
        );
      })
    );
  };

  if (categorySegment === "compliance") {
    const matchedService = findComplianceService(serviceSegment);

    return {
      categoryId: "compliance",
      serviceId: matchedService?.id || null
    };
  }

  const directComplianceService = findComplianceService(categorySegment);

  if (directComplianceService) {
    return {
      categoryId: "compliance",
      serviceId: directComplianceService.id
    };
  }

  const matchedCategory = SERVICE_STORE_CATEGORIES.find(
    (category) => normalizeServiceStoreSegment(category.id) === categorySegment
  );

  if (matchedCategory) {
    return {
      categoryId: matchedCategory.id,
      serviceId: null
    };
  }

  return {
    categoryId: null,
    serviceId: null
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
          isSelected ? "bg-[#eef3ff] text-[#2952ff]" : "bg-slate-50 text-slate-400"
        }`}
      >
        <Icon size={28} />
      </div>
      <h3 className="mt-8 text-3xl font-black tracking-tight text-slate-900">
        {service.title}
      </h3>
      <p className="mt-3 text-sm font-semibold text-[#2952ff]">{service.subtitle}</p>
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
        <p className="mt-3 text-sm font-bold text-[#2952ff]">{service.subtitle}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{service.caption}</p>
      </div>
      <div className="mt-6 flex items-center justify-between text-[11px] font-black uppercase tracking-[0.22em] text-[#2952ff]">
        Click Here
        <ArrowRight size={20} className="transition group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function CertificateOfOriginWorkflow({ service, onBack }) {
  const [certType, setCertType] = useState("non-preferential");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [issuingAgency, setIssuingAgency] = useState("");
  const [agreement, setAgreement] = useState("");
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [files, setFiles] = useState({
    invoice: { status: "Not Uploaded", name: null },
    packingList: { status: "Not Uploaded", name: null },
    costSheet: { status: "Not Uploaded", name: null },
    bol: { status: "Not Uploaded", name: null },
    mfgDecl: { status: "Not Uploaded", name: null }
  });

  useEffect(() => {
    if (!showSavedMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setShowSavedMessage(false), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [showSavedMessage]);

  const walletBalance = 12500;
  const creditLineBalance = 50000;
  const costs =
    certType === "preferential"
      ? { officialFee: 650, serviceCharge: 255, gst: 45.9 }
      : { officialFee: 450, serviceCharge: 125, gst: 22.5 };
  const totalDeduction = costs.officialFee + costs.serviceCharge + costs.gst;
  const walletAfter = walletBalance - costs.officialFee;
  const creditAfter = creditLineBalance - (costs.serviceCharge + costs.gst);

  const handleUpload = (type) => {
    setFiles((currentFiles) => ({
      ...currentFiles,
      [type]: { status: "Uploaded", name: `${type}_final_v1.pdf` }
    }));
  };

  const handleSaveDraft = () => {
    setShowSavedMessage(true);
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

  const documentFields = [
    { id: "invoice", label: "Commercial Invoice", req: true },
    { id: "packingList", label: "Packing List", req: true },
    {
      id: "costSheet",
      label: "Cost Sheet",
      req: true,
      sample: true,
      hide: certType === "non-preferential"
    },
    {
      id: "mfgDecl",
      label: "Manufacturer's Declaration",
      req: true,
      hide: certType === "non-preferential"
    },
    { id: "bol", label: "Bill of Lading / AWB", req: false }
  ].filter((field) => !field.hide);

  const formatAmount = (value) => `Rs. ${Number(value).toLocaleString("en-IN")}`;

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
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
                    Issuance of {service.title}
                  </h1>
                  <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
                    Transactional
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                    DGFT Compliance Standard
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
              <button
                type="button"
                onClick={() => setCertType("non-preferential")}
                className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all ${
                  certType === "non-preferential"
                    ? "border border-blue-100 bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Globe size={18} />
                <span className="text-sm font-bold tracking-tight">Non-Preferential</span>
              </button>
              <button
                type="button"
                onClick={() => setCertType("preferential")}
                className={`flex flex-col items-center gap-1 rounded-xl px-4 py-3 transition-all ${
                  certType === "preferential"
                    ? "border border-blue-100 bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Scale size={18} />
                <span className="text-sm font-bold tracking-tight">Preferential (FTA)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="px-1 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                  Invoice Number
                </label>
                <input
                  type="text"
                  placeholder="INV/2026/0042"
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
                    <option value="ficci">FICCI</option>
                    <option value="cii">CII</option>
                    <option value="eepc">EEPC India</option>
                    <option value="apex">Apex Chamber of Commerce</option>
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
                    <option value="AE">United Arab Emirates</option>
                    <option value="SG">Singapore</option>
                    <option value="DE">Germany</option>
                    <option value="VN">Vietnam</option>
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
                  <option value="cepa">India-UAE CEPA</option>
                  <option value="aifta">ASEAN-India FTA</option>
                  <option value="isfta">Indo-Sri Lanka FTA</option>
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
                          <span className="text-xs font-bold text-slate-800">{doc.label}</span>
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

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpload(doc.id)}
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase transition-all ${
                          files[doc.id].status === "Uploaded"
                            ? "border-green-200 bg-green-50 text-green-600"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        }`}
                      >
                        {files[doc.id].status === "Uploaded" ? "Replace" : "Attach File"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            </div>

            <div className="space-y-4 overflow-hidden rounded-[24px] border border-slate-800 bg-slate-900 shadow-xl xl:sticky xl:top-24 xl:self-start">
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
                      <span className="text-white">₹{costs.serviceCharge.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1.5 text-xs">
                      <span className="font-bold text-slate-400">GST (18%)</span>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
              >
                <Save size={16} className="text-slate-500" />
                Save as Draft
              </button>

              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    icon: isFormValid ? "success" : "info",
                    title: isFormValid ? "Payment flow ready" : "Complete Information",
                    text: isFormValid
                      ? "Certificate of Origin processing flow will be connected in the next phase."
                      : "Fill the required fields and upload the mandatory documents to continue.",
                    confirmButtonColor: "#2952ff"
                  })
                }
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-black transition-all active:scale-95 ${
                  isFormValid
                    ? "bg-blue-700 text-white shadow-xl shadow-blue-200 hover:bg-blue-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-400"
                }`}
              >
                {isFormValid ? "Confirm & Process Payment" : "Complete Information"}
                {isFormValid ? <ArrowRight size={16} /> : null}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComplianceServiceDetailView({ service, onBack }) {
  if (service.id === "certificate-of-origin") {
    return <CertificateOfOriginWorkflow service={service} onBack={onBack} />;
  }

  const Icon = service.icon;

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <div className="rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="px-6 py-6 md:px-8">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#101eb9]"
            >
              <ArrowLeft size={16} />
              Back to Compliance
            </button>

            <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-start">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#eef3ff] text-[#2952ff]">
                <Icon size={34} />
              </div>

              <div className="max-w-4xl">
                <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
                  Compliance Service
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                  {service.title}
                </h1>
                <p className="mt-4 text-base font-semibold text-[#2952ff]">
                  {service.subtitle}
                </p>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
                  {service.caption}. This route is now wired correctly, so when users click
                  the inner Compliance menu they land on the matching service screen instead
                  of a broken or mismatched view.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 transition hover:text-rose-500"
            >
              Back to Services
            </button>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    icon: "success",
                    title: "Draft saved",
                    text: `${service.title} has been saved in your current navigation flow.`,
                    confirmButtonColor: "#101eb9"
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-4 text-sm font-black text-slate-700 shadow-sm"
              >
                <Save size={16} />
                Save Draft
              </button>

              <button
                type="button"
                onClick={() =>
                  Swal.fire({
                    icon: "info",
                    title: service.title,
                    text: `${service.title} detail workflow will be connected in the next phase.`,
                    confirmButtonColor: "#101eb9"
                  })
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2952ff] px-8 py-4 text-sm font-black text-white shadow-xl shadow-blue-200"
              >
                Continue
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ServiceStore() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedComplianceServiceId, setSelectedComplianceServiceId] = useState(null);
  const { categoryId, serviceId } = useMemo(
    () => mapPathToState(location.pathname),
    [location.pathname]
  );

  useEffect(() => {
    setSelectedComplianceServiceId(serviceId || null);
  }, [serviceId]);

  const selectedCategory = SERVICE_STORE_CATEGORIES.find(
    category => category.id === categoryId
  );
  const selectedService = COMPLIANCE_SERVICES.find(
    service => service.id === selectedComplianceServiceId
  );

  const handleCategorySelect = category => {
    navigate(category.path);
  };

  const handleServiceSelect = service => {
    navigate(`/client/service-store/compliance/${service.id}`);
  };

  const handleCategoryServiceSelect = service => {
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
    setSelectedComplianceServiceId(null);
    navigate("/client/service-store");
  };

  const goToCompliance = () => {
    setSelectedComplianceServiceId(null);
    navigate("/client/service-store/compliance");
  };

  if (selectedCategory?.id === "compliance" && selectedService) {
    return (
      <ComplianceServiceDetailView
        service={selectedService}
        onBack={goToCompliance}
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
                  This screen now acts as the parent Compliance view. All submenu
                  services are surfaced here so users can browse and select them from one
                  place.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {COMPLIANCE_SERVICES.map(service => (
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
                      confirmButtonColor: "#2952ff"
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
                  Select a service from this category to continue with the workflow.
                </p>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categoryServices.map(service => (
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
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-6">
        <section className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 px-6 py-7 md:px-8">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-slate-400">
              Service Store
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Service Store
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
              Browse the available service categories and open the right workflow from one place.
            </p>
          </div>

          <div className="grid gap-5 px-6 py-6 md:grid-cols-2 md:px-8 xl:grid-cols-3">
            {SERVICE_STORE_CATEGORIES.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                onSelect={handleCategorySelect}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
