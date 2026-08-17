export const COMPANY_TYPE_OPTIONS = [
  "Private Limited",
  "Public Limited",
  "Partnership Firm",
  "LLP",
  "Proprietor"
];

export const EXPORTER_CATEGORY_OPTIONS = [
  "Merchant Exporter",
  "Manufacturer Exporter",
  "Importer",
  "Merchant Exporter and Importer",
  "Manufacturer Exporter and Importer"
];

export const YES_NO_OPTIONS = ["YES", "NO"];

export const UDHYAM_STATUS_OPTIONS = ["Micro", "Small", "Medium"];

export const KEY_PERSON_TITLE_OPTIONS = ["Mr", "Ms", "Mrs", "Dr", "M/s"];

export const PORTAL_NAME_OPTIONS = [
  "DGFT (Directorate General of Foreign Trade) *",
  "ICEGATE (Customs) *",
  "Others"
];

export const CLIENT_COMPANY_DOCUMENT_FIELDS = [
  { key: "pan", type: "pan", label: "PAN Card Copy", accept: ".pdf,.png,.jpg,.jpeg" },
  { key: "iec", type: "iec", label: "IEC Certificate Copy", accept: ".pdf,.png,.jpg,.jpeg" },
  {
    key: "incorporation",
    type: "incorporation",
    label: "Incorporation Certificate Copy",
    accept: ".pdf,.png,.jpg,.jpeg"
  },
  {
    key: "udhyam",
    type: "udhyam",
    label: "Udhyam Certificate Copy",
    accept: ".pdf,.png,.jpg,.jpeg"
  },
  { key: "rcmc", type: "rcmc", label: "RCMC Document", accept: ".pdf,.png,.jpg,.jpeg" },
  {
    key: "shopEstablishment",
    type: "shop_establishment",
    label: "Shop Establishment",
    accept: ".pdf,.png,.jpg,.jpeg"
  },
  {
    key: "partnershipDeed",
    type: "partnership_deed",
    label: "Partnership Deed",
    accept: ".pdf,.png,.jpg,.jpeg"
  }
];
