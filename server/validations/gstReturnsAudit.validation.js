const RETURN_TYPES = new Set(["gstr1_3b", "itc_audit", "gstr9"]);
const text = (value) => typeof value === "string" ? value.trim() : "";
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function validateGstReturnsQuote(body = {}) {
  const returnType = text(body.returnType).toLowerCase();
  return RETURN_TYPES.has(returnType)
    ? { valid: true, value: { returnType } }
    : { valid: false, errors: { returnType: "Select a valid GST return or audit type" } };
}

export function validateGstReturnsRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    returnType: text(body.returnType).toLowerCase(),
    gstin: text(body.gstin).toUpperCase(),
    exportTurnover: text(body.exportTurnover),
    itcValue: text(body.itcValue),
    reportingPeriod: text(body.reportingPeriod),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = {};
  if (!RETURN_TYPES.has(value.returnType)) errors.returnType = "Select a valid GST return or audit type";
  if (requireComplete) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.gstin)) errors.gstin = "Enter a valid 15-character GSTIN";
    if (!positive(value.exportTurnover)) errors.exportTurnover = "Enter a valid export turnover";
    if (value.itcValue && (!Number.isFinite(Number(value.itcValue)) || Number(value.itcValue) < 0)) errors.itcValue = "Enter a valid ITC value";
    if (!value.reportingPeriod) errors.reportingPeriod = "Select the reporting period";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
