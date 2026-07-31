const TYPES = new Set(["monthly", "quarterly", "intimation"]);
const text = (value) => typeof value === "string" ? value.trim() : "";

export function validateIgcrQuote(body = {}) {
  const requestType = text(body.requestType).toLowerCase();
  return TYPES.has(requestType)
    ? { valid: true, value: { requestType } }
    : { valid: false, errors: { requestType: "Select Monthly, Quarterly, or Intimation" } };
}

export function validateIgcrRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    requestType: text(body.requestType).toLowerCase(),
    igcrId: text(body.igcrId).toUpperCase(),
    reportingPeriod: text(body.reportingPeriod),
    boeCount: body.boeCount === "" || body.boeCount == null ? "" : Number(body.boeCount),
    consumptionValue: body.consumptionValue === "" || body.consumptionValue == null ? "" : Number(body.consumptionValue),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = {};
  if (!TYPES.has(value.requestType)) errors.requestType = "Select a valid IGCR filing type";
  if (value.boeCount !== "" && (!Number.isInteger(value.boeCount) || value.boeCount < 0)) errors.boeCount = "BOE count must be a whole number";
  if (value.consumptionValue !== "" && (!Number.isFinite(value.consumptionValue) || value.consumptionValue < 0)) errors.consumptionValue = "Consumed value must be zero or greater";
  if (requireComplete) {
    if (!value.igcrId) errors.igcrId = "Enter the IGCR identification ID";
    if (!value.reportingPeriod) errors.reportingPeriod = "Select the reporting period";
    if (value.boeCount === "" || value.boeCount <= 0) errors.boeCount = "Enter the active Bill of Entry count";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
