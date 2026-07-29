const FILING_PARTS = new Set(["intent", "commence"]);

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateIemRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    filingPart: text(body.filingPart),
    nicCode: text(body.nicCode),
    investment: text(body.investment),
    expectedEmployment: text(body.expectedEmployment),
    sectorEligibility: text(body.sectorEligibility),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = {};
  if (!FILING_PARTS.has(value.filingPart)) errors.filingPart = "Select a valid IEM filing part";
  if (requireComplete) {
    if (!/^\d{5}$/.test(value.nicCode)) errors.nicCode = "Enter a valid 5-digit NIC code";
    if (!value.investment || Number(value.investment) <= 0) errors.investment = "Enter the investment in plant and machinery";
    if (!value.expectedEmployment || Number(value.expectedEmployment) <= 0) errors.expectedEmployment = "Enter expected employment";
    if (!value.sectorEligibility) errors.sectorEligibility = "Select sector eligibility";
    for (const documentKey of ["processDescription", "moaAoa"]) {
      if (value.documents[documentKey]?.status !== "Uploaded") {
        errors[`documents.${documentKey}`] = "Required document is not uploaded";
      }
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}

export function validateIemQuote(body = {}) {
  const filingPart = text(body.filingPart);
  return FILING_PARTS.has(filingPart)
    ? { valid: true, value: { filingPart } }
    : { valid: false, errors: { filingPart: "Select a valid IEM filing part" } };
}
