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
    else if (value.modelNumber.length > 100) errors.modelNumber = "Equipment model number must not exceed 100 characters";
    if (value.requestMode === "eta") {
      if (!value.frequencyRange) errors.frequencyRange = "Enter the operating frequency range";
      else if (value.frequencyRange.length > 120) errors.frequencyRange = "Frequency range must not exceed 120 characters";
      const numericPower = Number(value.outputPower);
      if (!value.outputPower || !Number.isFinite(numericPower) || numericPower <= 0 || numericPower > 1000) {
        errors.outputPower = "Enter a valid RF output power between 0 and 1000 dBm";
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
