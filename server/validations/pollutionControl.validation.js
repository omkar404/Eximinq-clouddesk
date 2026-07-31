const TYPES = new Set(["cte", "cto", "renewal", "returns"]);
const CATEGORIES = new Set(["red", "orange", "green", "white"]);
const text = value => typeof value === "string" ? value.trim() : "";

export function validatePollutionQuote(body = {}) {
  const value = { requestType: text(body.requestType).toLowerCase(), industryCategory: text(body.industryCategory).toLowerCase(), grossBlock: Number(body.grossBlock || 0) };
  const errors = {};
  if (!TYPES.has(value.requestType)) errors.requestType = "Select a valid consent filing type";
  if (!CATEGORIES.has(value.industryCategory)) errors.industryCategory = "Select a valid pollution category";
  if (!Number.isFinite(value.grossBlock) || value.grossBlock < 0) errors.grossBlock = "Gross block must be zero or greater";
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validatePollutionRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validatePollutionQuote(body);
  const value = { ...quote.value, requestId: body.requestId || null, waterKld: body.waterKld === "" || body.waterKld == null ? "" : Number(body.waterKld), emissionSource: text(body.emissionSource), documents: body.documents && typeof body.documents === "object" ? body.documents : {} };
  const errors = { ...quote.errors };
  if (value.waterKld !== "" && (!Number.isFinite(value.waterKld) || value.waterKld < 0)) errors.waterKld = "Water consumption must be zero or greater";
  if (requireComplete) {
    if (!(value.grossBlock > 0)) errors.grossBlock = "Enter the gross block investment";
    if (value.waterKld === "" || value.waterKld < 0) errors.waterKld = "Enter the daily water consumption";
    if (!value.emissionSource) errors.emissionSource = "Select the air emission source";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
