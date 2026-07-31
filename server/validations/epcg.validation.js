const TYPES = new Set(["new", "extension", "redemption"]);
const OFFICES = new Set(["mumbai", "delhi", "chennai", "kolkata"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateEpcgQuote(body = {}) {
  const epcgType = text(body.epcgType);
  const dutyValue = body.dutyValue === "" || body.dutyValue == null ? 0 : Number(body.dutyValue);
  const errors = {};
  if (!TYPES.has(epcgType)) errors.epcgType = "Select an EPCG request type";
  if (!Number.isFinite(dutyValue) || dutyValue < 0) errors.dutyValue = "Duty value must be zero or greater";
  return { valid: Object.keys(errors).length === 0, errors, value: { epcgType, dutyValue } };
}

export function validateEpcgRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateEpcgQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    raOffice: text(body.raOffice),
    licenseNumber: text(body.licenseNumber).toUpperCase(),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = { ...quote.errors };
  if (value.raOffice && !OFFICES.has(value.raOffice)) errors.raOffice = "Select a valid DGFT RA office";
  if (requireComplete && !OFFICES.has(value.raOffice)) errors.raOffice = "Select the DGFT RA office";
  if (requireComplete && ["extension", "redemption"].includes(value.epcgType) && !value.licenseNumber)
    errors.licenseNumber = "Enter the EPCG licence number";
  if (requireComplete && ["new", "redemption"].includes(value.epcgType) && value.dutyValue <= 0)
    errors.dutyValue = "Enter a positive duty-saved value";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
