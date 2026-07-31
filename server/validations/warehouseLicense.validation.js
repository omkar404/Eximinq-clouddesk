const TYPES = new Set(["New", "Renewal"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateWarehouseLicenseQuote(body = {}) {
  const requestType = text(body.requestType);
  const totalCargoValue = Number(body.totalCargoValue || 0);
  const errors = {};
  if (!TYPES.has(requestType)) errors.requestType = "Select New License or Renewal / Amendment";
  if (!Number.isFinite(totalCargoValue) || totalCargoValue < 0) errors.totalCargoValue = "Enter a valid annual cargo value";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestType, totalCargoValue } };
}

export function validateWarehouseLicenseRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateWarehouseLicenseQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    commissionerate: text(body.commissionerate),
    warehouseArea: Number(body.warehouseArea || 0),
    existingLicenseNo: text(body.existingLicenseNo).toUpperCase(),
    solvencyValue: Number(body.solvencyValue || 0),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (!Number.isFinite(value.warehouseArea) || value.warehouseArea < 0) errors.warehouseArea = "Enter a valid warehouse area";
  if (!Number.isFinite(value.solvencyValue) || value.solvencyValue < 0) errors.solvencyValue = "Enter a valid solvency limit";
  if (requireComplete && !value.commissionerate) errors.commissionerate = "Enter the jurisdictional commissionerate";
  if (requireComplete && value.warehouseArea <= 0) errors.warehouseArea = "Enter the warehouse storage area";
  if (requireComplete && value.totalCargoValue <= 0) errors.totalCargoValue = "Enter the estimated annual bonded cargo value";
  if (requireComplete && value.solvencyValue <= 0) errors.solvencyValue = "Enter the bank solvency limit";
  if (requireComplete && value.requestType === "Renewal" && !value.existingLicenseNo) errors.existingLicenseNo = "Enter the existing warehouse license number";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
