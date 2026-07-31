const TYPES = new Set(["adv-4h", "epcg-5c", "star-fob", "rcmc", "gst-turnover", "solvency"]);
const text = value => typeof value === "string" ? value.trim() : "";

export function validateCaCertificationQuote(body = {}) {
  const value = { certificationType: text(body.certificationType).toLowerCase() };
  const errors = {};
  if (!TYPES.has(value.certificationType)) errors.certificationType = "Select a valid CA certification type";
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateCaCertificationRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateCaCertificationQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    udinNumber: text(body.udinNumber).toUpperCase(),
    certifiedValue: body.certifiedValue === "" || body.certifiedValue == null ? "" : Number(body.certifiedValue),
    schemeReference: text(body.schemeReference),
    epcCouncil: text(body.epcCouncil).toUpperCase(),
    gstNumber: text(body.gstNumber).toUpperCase(),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = { ...quote.errors };
  if (value.certifiedValue !== "" && (!Number.isFinite(value.certifiedValue) || value.certifiedValue <= 0)) errors.certifiedValue = "Certified value must be greater than zero";
  if (value.gstNumber && !/^[0-9A-Z]{15}$/.test(value.gstNumber)) errors.gstNumber = "GSTIN must contain exactly 15 letters and numbers";
  if (requireComplete) {
    if (!value.udinNumber) errors.udinNumber = "Enter the CA UDIN number";
    if (!(value.certifiedValue > 0)) errors.certifiedValue = "Enter the value to be certified";
    if (value.certificationType === "rcmc" && !value.epcCouncil) errors.epcCouncil = "Select the Export Promotion Council";
    if (value.certificationType === "gst-turnover" && !value.gstNumber) errors.gstNumber = "Enter the 15-character GSTIN";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
