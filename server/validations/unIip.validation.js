const REQUEST_TYPES = new Set(["new", "renewal"]);
const HAZARD_CLASSES = new Set(["3", "6.1", "8", "9"]);
const PACKAGING_GROUPS = new Set(["I", "II", "III"]);
const text = (value) => typeof value === "string" ? value.trim() : "";
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;

export function validateUnIipQuote(body = {}) {
  const requestType = text(body.requestType).toLowerCase();
  return REQUEST_TYPES.has(requestType)
    ? { valid: true, value: { requestType } }
    : { valid: false, errors: { requestType: "Select a valid packaging audit type" } };
}

export function validateUnIipRequest(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    requestType: text(body.requestType).toLowerCase(),
    shippingName: text(body.shippingName),
    unNumber: text(body.unNumber),
    hazardClass: text(body.hazardClass),
    packagingGroup: text(body.packagingGroup).toUpperCase(),
    grossWeight: text(body.grossWeight),
    dimensionLength: text(body.dimensionLength),
    dimensionWidth: text(body.dimensionWidth),
    stitchesPerDm: text(body.stitchesPerDm),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {},
  };
  const errors = {};
  if (!REQUEST_TYPES.has(value.requestType)) errors.requestType = "Select a valid packaging audit type";
  if (requireComplete) {
    if (!value.shippingName) errors.shippingName = "Enter the proper shipping name";
    if (!/^\d{4}$/.test(value.unNumber)) errors.unNumber = "Enter a valid 4-digit UN number";
    if (!HAZARD_CLASSES.has(value.hazardClass)) errors.hazardClass = "Select a valid hazard class";
    if (!PACKAGING_GROUPS.has(value.packagingGroup)) errors.packagingGroup = "Select a packaging group";
    if (!positive(value.grossWeight)) errors.grossWeight = "Enter a valid gross/net mass";
    if (!positive(value.dimensionLength)) errors.dimensionLength = "Enter a valid package length";
    if (!positive(value.dimensionWidth)) errors.dimensionWidth = "Enter a valid package width";
    if (!positive(value.stitchesPerDm)) errors.stitchesPerDm = "Enter valid stitches per dm";
  }
  return { valid: Object.keys(errors).length === 0, errors, value };
}
