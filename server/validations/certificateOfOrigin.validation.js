const CERTIFICATE_TYPES = new Set(["non-preferential", "preferential"]);

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateQuotePayload(body = {}) {
  const certificateType = cleanString(body.certificateType);

  if (!CERTIFICATE_TYPES.has(certificateType)) {
    return {
      valid: false,
      errors: { certificateType: "Select a valid certificate type" }
    };
  }

  return { valid: true, value: { certificateType } };
}

export function validateRequestPayload(body = {}, { requireComplete = false } = {}) {
  const value = {
    requestId: body.requestId || null,
    certificateType: cleanString(body.certificateType),
    invoiceNumber: cleanString(body.invoiceNumber),
    issuingAgency: cleanString(body.issuingAgency),
    destinationCountry: cleanString(body.destinationCountry),
    agreement: cleanString(body.agreement),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = {};

  if (!CERTIFICATE_TYPES.has(value.certificateType)) {
    errors.certificateType = "Select a valid certificate type";
  }

  if (requireComplete) {
    if (!value.invoiceNumber) errors.invoiceNumber = "Invoice number is required";
    if (!value.issuingAgency) errors.issuingAgency = "Issuing agency is required";
    if (!value.destinationCountry) errors.destinationCountry = "Destination country is required";
    if (value.certificateType === "preferential" && !value.agreement) {
      errors.agreement = "FTA agreement is required for a preferential certificate";
    }

    const requiredDocuments =
      value.certificateType === "preferential"
        ? ["invoice", "packingList", "costSheet", "mfgDecl"]
        : ["invoice", "packingList"];

    for (const documentId of requiredDocuments) {
      if (value.documents[documentId]?.status !== "Uploaded") {
        errors[`documents.${documentId}`] = "Required document is not uploaded";
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value
  };
}
