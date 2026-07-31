const REQUEST_TYPES = new Set(["new", "renewal"]);
const text = (value) => typeof value === "string" ? value.trim() : "";

export function validateGstLutQuote(body = {}) {
  const requestType = text(body.requestType).toLowerCase();
  return REQUEST_TYPES.has(requestType)
    ? { valid: true, value: { requestType } }
    : { valid: false, errors: { requestType: "Select a valid LUT filing type" } };
}

export function validateGstLutRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    requestType: text(body.requestType).toLowerCase(),
    gstin: text(body.gstin).toUpperCase(),
    financialYear: text(body.financialYear),
    witnessOne: text(body.witnessOne),
    witnessTwo: text(body.witnessTwo),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = {};
  if (!REQUEST_TYPES.has(value.requestType)) errors.requestType = "Select a valid LUT filing type";
  if (requireComplete) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value.gstin)) errors.gstin = "Enter a valid 15-character GSTIN";
    if (!/^\d{4}-\d{2}$/.test(value.financialYear)) errors.financialYear = "Select a valid financial year";
    if (!value.witnessOne) errors.witnessOne = "Enter the first witness name";
    if (!value.witnessTwo) errors.witnessTwo = "Enter the second witness name";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
