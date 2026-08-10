const TYPES = new Set(["New", "Renewal"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateFactoryLicenseQuote(body = {}) {
  const requestType = text(body.requestType);
  const estimatedMonthlyContainers = Number(body.estimatedMonthlyContainers || 0);
  const errors = {};
  if (!TYPES.has(requestType)) errors.requestType = "Select New Permission or Renewal";
  if (!Number.isFinite(estimatedMonthlyContainers) || estimatedMonthlyContainers < 0) errors.estimatedMonthlyContainers = "Enter a valid monthly container estimate";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestType, estimatedMonthlyContainers } };
}

export function validateFactoryLicenseRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateFactoryLicenseQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    commissionerate: text(body.commissionerate),
    factoryAddress: text(body.factoryAddress),
    previousPermissionNo: text(body.previousPermissionNo).toUpperCase(),
    infrastructureReady: body.infrastructureReady === true,
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (requireComplete && !value.commissionerate) errors.commissionerate = "Enter the jurisdictional Customs Commissionerate";
  if (requireComplete && !value.factoryAddress) errors.factoryAddress = "Enter the complete factory address";
  if (requireComplete && value.estimatedMonthlyContainers <= 0) errors.estimatedMonthlyContainers = "Enter the estimated monthly container volume";
  if (requireComplete && !value.infrastructureReady) errors.infrastructureReady = "Confirm CCTV, sealing and examination infrastructure readiness";
  if (requireComplete && value.requestType === "Renewal" && !value.previousPermissionNo) errors.previousPermissionNo = "Enter the previous permission number";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
