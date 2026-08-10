const MODES = new Set(["CRS", "ISI", "FMCS"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateBisQuote(body = {}) {
  const requestMode = text(body.requestMode);
  const errors = {};
  if (!MODES.has(requestMode)) errors.requestMode = "Select CRS, ISI, or FMCS certification";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestMode } };
}

export function validateBisRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateBisQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    isStandard: text(body.isStandard),
    modelName: text(body.modelName),
    variantCount: body.variantCount === "" || body.variantCount == null ? null : Number(body.variantCount),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (value.isStandard.length > 100) errors.isStandard = "IS standard must be 100 characters or fewer";
  if (value.modelName.length > 160) errors.modelName = "Model name must be 160 characters or fewer";
  if (value.variantCount != null && (!Number.isInteger(value.variantCount) || value.variantCount < 1 || value.variantCount > 1000)) errors.variantCount = "Variant count must be between 1 and 1000";
  if (requireComplete) {
    if (!value.isStandard) errors.isStandard = "Enter the applicable IS standard";
    if (!value.modelName) errors.modelName = "Enter the product or model name";
    if (!Number.isInteger(value.variantCount) || value.variantCount < 1) errors.variantCount = "Enter at least one variant";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
