const TYPES = new Set(["Auto", "Reconcile"]);
const text = (value) => (typeof value === "string" ? value.trim() : "");

export function validateEbrcQuote(body = {}) {
  const ebrcType = text(body.ebrcType);
  const errors = {};
  if (!TYPES.has(ebrcType)) errors.ebrcType = "Select Self-Issuance or Reconciliation";
  return { valid: Object.keys(errors).length === 0, errors, value: { ebrcType } };
}

export function validateEbrcRequest(body = {}, { requireComplete = false } = {}) {
  const quote = validateEbrcQuote(body);
  const realizedValue = body.realizedValue === "" || body.realizedValue == null ? null : Number(body.realizedValue);
  const value = {
    ...quote.value,
    requestId: body.requestId || null,
    shippingBillNumber: text(body.shippingBillNumber),
    realizedValue,
    irmNumber: text(body.irmNumber).toUpperCase(),
    bankAdCode: text(body.bankAdCode).replace(/\D/g, ""),
    documents: body.documents && typeof body.documents === "object" ? body.documents : {}
  };
  const errors = { ...quote.errors };
  if (value.shippingBillNumber && !/^\d{7}$/.test(value.shippingBillNumber)) errors.shippingBillNumber = "Enter the 7-digit Shipping Bill number";
  if (value.realizedValue != null && (!Number.isFinite(value.realizedValue) || value.realizedValue <= 0)) errors.realizedValue = "Enter a positive realized value";
  if (value.bankAdCode && !/^\d{7}$/.test(value.bankAdCode)) errors.bankAdCode = "Enter the 7-digit bank AD code";
  if (requireComplete && !/^\d{7}$/.test(value.shippingBillNumber)) errors.shippingBillNumber = "Enter the 7-digit Shipping Bill number";
  if (requireComplete && (!Number.isFinite(value.realizedValue) || value.realizedValue <= 0)) errors.realizedValue = "Enter a positive realized value";
  if (requireComplete && value.ebrcType === "Reconcile" && !value.irmNumber) errors.irmNumber = "Enter the IRM number";
  if (requireComplete && value.ebrcType === "Reconcile" && !/^\d{7}$/.test(value.bankAdCode)) errors.bankAdCode = "Enter the 7-digit bank AD code";
  return { valid: Object.keys(errors).length === 0, errors, value };
}
