const MODES = new Set(["eta", "import-license"]);
const text = (value) => typeof value === "string" ? value.trim() : "";

export function validateWpcEtaQuote(body = {}) {
  const requestMode = text(body.requestMode).toLowerCase();
  return MODES.has(requestMode)
    ? { valid: true, value: { requestMode } }
    : { valid: false, errors: { requestMode: "Select a valid WPC authorization type" } };
}

export function validateWpcEtaRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    requestMode: text(body.requestMode).toLowerCase(),
    modelNumber: text(body.modelNumber),
    frequencyRange: text(body.frequencyRange),
    outputPower: text(body.outputPower),
    gsrCompliance: text(body.gsrCompliance) || "Compliant with Gazetted Norms",
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = {};
  if (!MODES.has(value.requestMode)) errors.requestMode = "Select a valid WPC authorization type";
  if (requireComplete) {
    if (!value.modelNumber) errors.modelNumber = "Enter the equipment model number";
    if (value.requestMode === "eta") {
      if (!value.frequencyRange) errors.frequencyRange = "Enter the operating frequency range";
      if (!value.outputPower || Number(value.outputPower) <= 0) errors.outputPower = "Enter a valid RF output power";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
