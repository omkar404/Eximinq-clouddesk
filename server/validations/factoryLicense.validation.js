const TYPES = new Set(["New", "Renewal"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateFactoryLicenseQuote(body = {}) {
  const requestType = text(body.requestType);
  const errors = {};
  if (!TYPES.has(requestType)) errors.requestType = "Select New License or Renewal";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestType } };
}

export function validateFactoryLicenseRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateFactoryLicenseQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    workerCount: Number(body.workerCount),
    installedHP: Number(body.installedHP),
    factoryAddress: text(body.factoryAddress),
    prevLicenseNo: text(body.prevLicenseNo).toUpperCase(),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (requireComplete && (!Number.isInteger(value.workerCount) || value.workerCount <= 0)) errors.workerCount = "Enter the maximum worker count";
  if (requireComplete && (!Number.isFinite(value.installedHP) || value.installedHP <= 0)) errors.installedHP = "Enter the installed machinery power in HP";
  if (requireComplete && !value.factoryAddress) errors.factoryAddress = "Enter the complete factory address";
  if (requireComplete && value.requestType === "Renewal" && !value.prevLicenseNo) errors.prevLicenseNo = "Enter the existing factory licence number";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
