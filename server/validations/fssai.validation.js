const MODES = new Set(["License", "Returns", "Labelling", "FICS"]);
const LICENSE_TYPES = new Set(["New", "Renewal"]);
const LICENSE_ROLES = new Set(["Importer", "Exporter"]);
const FOOD_CATEGORIES = new Set(["Standardized", "Proprietary", "Health"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateFssaiQuote(body = {}) {
  const requestMode = text(body.requestMode);
  const errors = {};
  if (!MODES.has(requestMode)) errors.requestMode = "Select an FSSAI request mode";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestMode } };
}

export function validateFssaiRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateFssaiQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    licenseType: text(body.licenseType),
    licenseRole: text(body.licenseRole),
    foodCategory: text(body.foodCategory),
    shelfLifeRemaining: body.shelfLifeRemaining === "" ? null : Number(body.shelfLifeRemaining),
    reportingPeriod: text(body.reportingPeriod) || "APR 2025 - MAR 2026",
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (!FOOD_CATEGORIES.has(value.foodCategory)) errors.foodCategory = "Select a valid food category";
  if (value.requestMode === "License") {
    if (!LICENSE_TYPES.has(value.licenseType)) errors.licenseType = "Select New or Renewal";
    if (!LICENSE_ROLES.has(value.licenseRole)) errors.licenseRole = "Select Importer or Exporter";
  }
  if (value.requestMode === "FICS" && (!Number.isFinite(value.shelfLifeRemaining) || value.shelfLifeRemaining < 60 || value.shelfLifeRemaining > 100)) {
    errors.shelfLifeRemaining = "FICS clearance requires at least 60% remaining shelf life";
  }
  if (requireComplete && value.requestMode !== "FICS" && !value.reportingPeriod) errors.reportingPeriod = "Enter the reporting period";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
