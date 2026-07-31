const MODES = new Set(["AQCS", "PQMS"]);
const TYPES = new Set(["Permit", "Clearance"]);
const TREATMENTS = new Set(["Fumigation", "Heat", "Aluminium", "None"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateAqcsPqmsQuote(body = {}) {
  const requestMode = text(body.requestMode).toUpperCase();
  const requestType = text(body.requestType);
  const consignmentValue = Number(body.consignmentValue || 0);
  const errors = {};
  if (!MODES.has(requestMode)) errors.requestMode = "Select AQCS or PQMS";
  if (!TYPES.has(requestType)) errors.requestType = "Select Import Permit or Shipment Clearance";
  if (!Number.isFinite(consignmentValue) || consignmentValue < 0) errors.consignmentValue = "Enter a valid consignment value";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestMode, requestType, consignmentValue } };
}

export function validateAqcsPqmsRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateAqcsPqmsQuote(body);
  const value = { ...quote.value, requestId: body.requestId || null, portCode: text(body.portCode).toUpperCase(),
    treatmentType: text(body.treatmentType) || "Fumigation", documents: body.documents && typeof body.documents === "object" ? body.documents : {} };
  const errors = { ...quote.errors };
  if (!TREATMENTS.has(value.treatmentType)) errors.treatmentType = "Select a valid treatment method";
  if (requireComplete && !value.portCode) errors.portCode = "Enter the port of entry";
  if (value.portCode && !/^[A-Z0-9]{1,6}$/.test(value.portCode)) {
    errors.portCode = "Use a valid port code (maximum 6 letters or numbers)";
  }
  if (requireComplete && value.consignmentValue <= 0) errors.consignmentValue = "Enter the consignment value";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
