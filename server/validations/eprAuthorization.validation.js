const WASTE_TYPES = new Set(["plastic", "e-waste", "battery", "tyre"]);
const REQUEST_TYPES = new Set(["new", "return"]);
const text = value => typeof value === "string" ? value.trim() : "";

export function validateEprQuote(body = {}) {
  const value = {
    wasteType: text(body.wasteType).toLowerCase(),
    requestType: text(body.requestType).toLowerCase(),
    weightMT: Number(body.weightMT),
  };
  const errors = {};
  if (!WASTE_TYPES.has(value.wasteType)) errors.wasteType = "Select a valid waste stream";
  if (!REQUEST_TYPES.has(value.requestType)) errors.requestType = "Select a valid EPR request type";
  if (!Number.isFinite(value.weightMT) || value.weightMT < 0 || value.weightMT > 10000000) errors.weightMT = "Enter a valid annual weight in metric tonnes";
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateEprRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateEprQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    documentCount: Number(body.documentCount),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = { ...quote.errors };
  if (!Number.isInteger(value.documentCount) || value.documentCount < 1 || value.documentCount > 1000000) errors.documentCount = "Enter a valid number of shipping bills or bills of entry";
  if (requireComplete && value.weightMT <= 0) errors.weightMT = "Enter the total quantity in metric tonnes";
  if (!requireComplete) {
    delete errors.documentCount;
    if (value.weightMT === 0) delete errors.weightMT;
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
