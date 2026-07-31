const MODES = new Set(["importer", "packer", "label-audit"]);
const CATEGORIES = new Set(["non-food", "food", "electronic", "medical"]);
const text = value => typeof value === "string" ? value.trim() : "";

export function validateLmpcQuote(body = {}) {
  const value = {
    requestMode: text(body.requestMode).toLowerCase(),
    numberOfVariants: Number(body.numberOfVariants),
  };
  const errors = {};
  if (!MODES.has(value.requestMode)) errors.requestMode = "Select a valid LMPC request mode";
  if (!Number.isInteger(value.numberOfVariants) || value.numberOfVariants < 1 || value.numberOfVariants > 1000) errors.numberOfVariants = "Variants must be between 1 and 1000";
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateLmpcRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateLmpcQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    productCategory: text(body.productCategory).toLowerCase(),
    productDescription: text(body.productDescription),
    brandName: text(body.brandName),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = { ...quote.errors };
  if (!CATEGORIES.has(value.productCategory)) errors.productCategory = "Select a valid commodity category";
  if (requireComplete) {
    if (!value.productDescription) errors.productDescription = "Enter the packaged commodity description";
    if (!value.brandName) errors.brandName = "Enter the brand or trade name";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
