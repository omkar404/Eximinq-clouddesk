const REQUEST_TYPES = new Set(["New", "Modification"]);
const DESTINATIONS = new Set(["EU", "UK", "CH", "TR"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateRexQuote(body = {}) {
  const requestType = text(body.requestType);
  const errors = {};
  if (!REQUEST_TYPES.has(requestType)) errors.requestType = "Select New Registration or Modification";
  return { valid: Object.keys(errors).length === 0, errors, value: { requestType } };
}

export function validateRexRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateRexQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    hsCode: text(body.hsCode),
    valueAddition: body.valueAddition === "" || body.valueAddition == null ? null : Number(body.valueAddition),
    destination: text(body.destination),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (value.hsCode && !/^\d{4,8}$/.test(value.hsCode)) errors.hsCode = "Enter a valid 4 to 8 digit HS code";
  if (value.valueAddition != null && (!Number.isFinite(value.valueAddition) || value.valueAddition < 0 || value.valueAddition > 100)) errors.valueAddition = "Value addition must be between 0% and 100%";
  if (value.destination && !DESTINATIONS.has(value.destination)) errors.destination = "Select a valid destination market";
  if (requireComplete) {
    if (!/^\d{4,8}$/.test(value.hsCode)) errors.hsCode = "Enter a valid 4 to 8 digit HS code";
    if (!Number.isFinite(value.valueAddition) || value.valueAddition < 40 || value.valueAddition > 100) errors.valueAddition = "REX eligibility requires at least 40% value addition";
    if (!DESTINATIONS.has(value.destination)) errors.destination = "Select a destination market";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
