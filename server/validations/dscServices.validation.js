const APPLICANT_TYPES = new Set(["Individual", "Organization"]);
const CERTIFICATE_CLASSES = new Set(["Class2", "Class3"]);
const USAGE_TYPES = new Set(["Combo", "Signature", "Encryption"]);
const VALIDITY_YEARS = new Set([1, 2, 3]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateDscServicesQuote(body = {}) {
  const applicantType = text(body.applicantType);
  const dscClass = text(body.dscClass);
  const dscType = text(body.dscType);
  const validity = Number(body.validity);
  const errors = {};
  if (!APPLICANT_TYPES.has(applicantType)) errors.applicantType = "Select Individual or Organization";
  if (!CERTIFICATE_CLASSES.has(dscClass)) errors.dscClass = "Select a valid DSC class";
  if (!USAGE_TYPES.has(dscType)) errors.dscType = "Select a valid DSC usage type";
  if (!VALIDITY_YEARS.has(validity)) errors.validity = "Select a validity of 1, 2, or 3 years";
  return { valid: Object.keys(errors).length === 0, errors, value: { applicantType, dscClass, dscType, validity } };
}

export function validateDscServicesRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateDscServicesQuote(body);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    applicantName: text(body.applicantName),
    mobileNumber: text(body.mobileNumber).replace(/\D/g, ""),
    emailId: text(body.emailId).toLowerCase(),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (value.mobileNumber && !/^\d{10}$/.test(value.mobileNumber)) errors.mobileNumber = "Enter a valid 10-digit mobile number";
  if (value.emailId && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.emailId)) errors.emailId = "Enter a valid email address";
  if (requireComplete && !value.applicantName) errors.applicantName = "Enter the applicant or authorized signatory name";
  if (requireComplete && !/^\d{10}$/.test(value.mobileNumber)) errors.mobileNumber = "Enter a valid 10-digit mobile number";
  if (requireComplete && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.emailId)) errors.emailId = "Enter a valid email address";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
