const MODES = new Set(["medical-device", "drug", "cosmetic"]);
const DEVICE_CLASSES = new Set(["A", "B", "C", "D"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateCdscoQuote(body = {}) {
  const requestMode = text(body.requestMode).toLowerCase();
  const deviceClass = text(body.deviceClass).toUpperCase() || "B";
  const errors = {};
  if (!MODES.has(requestMode)) errors.requestMode = "Select a valid CDSCO authorization type";
  if (requestMode === "medical-device" && !DEVICE_CLASSES.has(deviceClass)) {
    errors.deviceClass = "Select a valid medical device class";
  }
  return { valid: Object.keys(errors).length === 0, errors, value: { requestMode, deviceClass } };
}

export function validateCdscoRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    requestMode: text(body.requestMode).toLowerCase(),
    deviceClass: text(body.deviceClass).toUpperCase() || "B",
    manufacturingCountry: text(body.manufacturingCountry),
    indianAgent: text(body.indianAgent) || "Linked Authorized Agent",
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = {};
  if (!MODES.has(value.requestMode)) errors.requestMode = "Select a valid CDSCO authorization type";
  if (value.requestMode === "medical-device" && !DEVICE_CLASSES.has(value.deviceClass)) {
    errors.deviceClass = "Select a valid medical device class";
  }
  if (requireComplete && !value.manufacturingCountry) {
    errors.manufacturingCountry = "Enter the manufacturing country";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
