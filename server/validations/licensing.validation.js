const object = value => value && typeof value === "object" && !Array.isArray(value);
export function validateLicensingRequest(_serviceSlug, body) {
  const errors = {};
  if (!object(body?.form)) errors.form = "Form data is required";
  if (body?.requestId != null && !String(body.requestId).trim()) errors.requestId = "Invalid request";
  return { valid: !Object.keys(errors).length, errors, value: { requestId: body?.requestId || null, form: object(body?.form) ? body.form : {} } };
}
