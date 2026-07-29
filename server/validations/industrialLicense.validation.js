const REQUEST_TYPES = new Set(["new", "amendment"]);
const LOCATION_TYPES = new Set(["standard", "restricted", "backward"]);

const text = (value) => typeof value === "string" ? value.trim() : "";

export function validateIndustrialLicenseQuote(body = {}) {
  const requestType = text(body.requestType).toLowerCase();
  return REQUEST_TYPES.has(requestType)
    ? { valid: true, value: { requestType } }
    : { valid: false, errors: { requestType: "Select a valid Industrial Licence request type" } };
}

export function validateIndustrialLicenseRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    requestType: text(body.requestType).toLowerCase(),
    nicCode: text(body.nicCode),
    investmentPM: text(body.investmentPM),
    locationType: text(body.locationType).toLowerCase(),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = {};
  if (!REQUEST_TYPES.has(value.requestType)) errors.requestType = "Select a valid request type";
  if (value.locationType && !LOCATION_TYPES.has(value.locationType)) errors.locationType = "Select a valid factory location";
  if (requireComplete) {
    if (!/^\d{5}$/.test(value.nicCode)) errors.nicCode = "Enter a valid 5-digit NIC code";
    if (!value.investmentPM || Number(value.investmentPM) <= 0) errors.investmentPM = "Enter investment in plant and machinery";
    if (!LOCATION_TYPES.has(value.locationType)) errors.locationType = "Select the factory location type";
    for (const key of ["technicalProcess", "projectReport", "landDocs", "moaAoa", "envClearance"]) {
      if (value.documents[key]?.status !== "Uploaded") errors[`documents.${key}`] = "Required document is not uploaded";
    }
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
