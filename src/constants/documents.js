export const COMPANY_DOCUMENT_FIELDS = [
  {
    type: "pan",
    label: "PAN Document",
    helper: "Validated PAN copy uploaded by the client."
  },
  {
    type: "iec",
    label: "IEC Document",
    helper: "PDF only. The file must contain a valid IEC number for backend extraction."
  },
  {
    type: "gstin",
    label: "GSTIN Document",
    helper: "PDF only. The file must contain a valid GSTIN for backend extraction."
  },
  {
    type: "incorporation",
    label: "Incorporation Document",
    helper: "Validated incorporation certificate uploaded by the client."
  },
  {
    type: "udhyam",
    label: "Udhyam Document",
    helper: "Validated Udhyam certificate uploaded by the client."
  },
  {
    type: "rcmc",
    label: "RCMC Document",
    helper: "PDF only. The file must contain a valid RCMC number for backend extraction."
  },
  {
    type: "shop_establishment",
    label: "Shop Establishment",
    helper: "Optional supporting upload with no auto-extraction."
  },
  {
    type: "partnership_deed",
    label: "Partnership Deed",
    helper: "Optional supporting upload with no auto-extraction."
  }
];

export const BOOKING_DOCUMENT_FIELDS = [
  {
    type: "commercial_invoice",
    label: "Commercial Invoice",
    accept: ".pdf,.png,.jpg,.jpeg",
    helper: "Accepted formats: PDF, PNG, JPG"
  },
  {
    type: "packing_list",
    label: "Packing List",
    accept: ".pdf,.png,.jpg,.jpeg",
    helper: "Accepted formats: PDF, PNG, JPG"
  },
  {
    type: "bill_of_lading",
    label: "Bill of Lading",
    accept: ".pdf,.png,.jpg,.jpeg",
    helper: "Accepted formats: PDF, PNG, JPG"
  }
];

export function getDocumentLabel(definitions, type) {
  return definitions.find((item) => item.type === type)?.label || type;
}
