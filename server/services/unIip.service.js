import {
  createServiceRequest, deleteServiceDocument, findFinancialContext,
  findServiceDefinition, findServiceDocument, findServiceRequest,
  listServiceDocuments, listServiceRequests, submitServiceRequestAndDeduct,
  updateServiceDraft, upsertServiceDocument,
} from "../models/serviceRequest.model.js";
import { listFinancialTransactions } from "../models/certificateOfOrigin.model.js";

const SERVICE_SLUG = "un-iip-certificate";
const httpError = (status, message, details) => Object.assign(new Error(message), { status, details });

async function getDefinition() {
  const definition = await findServiceDefinition(SERVICE_SLUG);
  if (!definition) throw httpError(404, "UN IIP Packaging Audit service is unavailable");
  return definition;
}

function calculatePricing(config, requestType) {
  const selected = config?.pricing?.[requestType];
  if (!selected) throw httpError(400, "Pricing is unavailable for the selected packaging audit type");
  const officialFee = Number(selected.officialFee || 0);
  const draftingFee = Number(selected.draftingFee || 0);
  const successPremium = Number(selected.successPremium || 0);
  const serviceCharge = draftingFee + successPremium;
  const gstRate = Number(selected.gstRate || 0);
  const gst = Number(((serviceCharge * gstRate) / 100).toFixed(2));
  return { currency: config.currency || "INR", officialFee, draftingFee, successPremium,
    serviceCharge, gstRate, gst, total: Number((officialFee + serviceCharge + gst).toFixed(2)) };
}

export async function getUnIipConfiguration(userId) {
  const [definition, finances] = await Promise.all([getDefinition(), findFinancialContext(userId)]);
  return { service: { slug: definition.slug, category: definition.category, name: definition.name,
    description: definition.description, ...definition.config }, financialContext: {
    walletBalance: Number(finances.wallet_balance || 0), creditLineBalance: Number(finances.credit_line_balance || 0),
    creditLimit: Number(finances.credit_limit || 0) } };
}
export async function getUnIipQuote(userId, requestType) {
  const { service, financialContext } = await getUnIipConfiguration(userId);
  const quote = calculatePricing(service, requestType);
  return { ...quote, openingWalletBalance: financialContext.walletBalance,
    closingWalletBalance: Number((financialContext.walletBalance - quote.officialFee).toFixed(2)),
    currentCreditLimit: financialContext.creditLineBalance,
    availableCreditAfter: Number((financialContext.creditLineBalance - quote.serviceCharge - quote.gst).toFixed(2)) };
}
export async function saveUnIipDraft(userId, payload) {
  const pricingSnapshot = await getUnIipQuote(userId, payload.requestType);
  if (!payload.requestId) return createServiceRequest({ userId, serviceSlug: SERVICE_SLUG, payload, pricingSnapshot });
  const current = await findServiceRequest(payload.requestId, userId, SERVICE_SLUG);
  if (!current) throw httpError(404, "UN IIP packaging audit draft not found");
  if (current.status !== "DRAFT") throw httpError(409, "Submitted requests can no longer be edited");
  return updateServiceDraft({ requestId: payload.requestId, userId, serviceSlug: SERVICE_SLUG, payload, pricingSnapshot });
}
export async function submitUnIip(userId, payload) {
  const [definition, pricingSnapshot] = await Promise.all([getDefinition(), getUnIipQuote(userId, payload.requestType)]);
  if (!payload.requestId) throw httpError(422, "Save the packaging audit request before submitting it");
  const uploadedDocuments = await listServiceDocuments(payload.requestId, userId, SERVICE_SLUG);
  const uploadedKeys = new Set(uploadedDocuments.map((item) => item.document_key));
  const missing = (definition.config?.documents || []).filter((item) => item.required &&
    (!item.requestTypes || item.requestTypes.includes(payload.requestType)) && !uploadedKeys.has(item.id));
  if (missing.length) throw httpError(422, "Upload all required packaging audit documents", { documents: missing.map((item) => item.id) });
  const verifiedPayload = { ...payload, documents: Object.fromEntries(uploadedDocuments.map((item) => [item.document_key,
    { status: "Uploaded", name: item.original_name }])) };
  try {
    return await submitServiceRequestAndDeduct({ userId, requestId: payload.requestId, serviceSlug: SERVICE_SLUG,
      payload: verifiedPayload, pricingSnapshot, serviceName: definition.name });
  } catch (error) {
    if (error.code?.startsWith("INSUFFICIENT_")) throw httpError(402, "Available balance is insufficient",
      { code: error.code, ...error.balanceDetails });
    if (error.code === "REQUEST_NOT_EDITABLE") throw httpError(409, error.message);
    throw error;
  }
}
export const getUnIipRequests = (userId) => listServiceRequests(userId, SERVICE_SLUG);
export async function getUnIipLedger(userId) {
  const [finances, transactions] = await Promise.all([findFinancialContext(userId), listFinancialTransactions(userId)]);
  return { balances: { walletBalance: Number(finances.wallet_balance || 0), creditLineBalance: Number(finances.credit_line_balance || 0),
    creditLimit: Number(finances.credit_limit || 0) }, transactions: transactions.map((item) => ({ id: item.id,
    accountType: item.account_type, transactionType: item.transaction_type, amount: Number(item.amount),
    balanceAfter: Number(item.balance_after), description: item.description, status: item.status,
    transactionDate: item.created_at, requestCode: item.request_code, serviceName: item.service_name })) };
}
export async function storeUnIipDocument({ userId, requestId, documentKey, file }) {
  const [request, definition] = await Promise.all([findServiceRequest(requestId, userId, SERVICE_SLUG), getDefinition()]);
  if (!request) throw httpError(404, "UN IIP packaging audit draft not found");
  if (request.status !== "DRAFT") throw httpError(409, "Documents cannot be changed after submission");
  if (!definition.config?.documents?.some((item) => item.id === documentKey)) throw httpError(400, "Unknown packaging audit document type");
  const previous = await findServiceDocument(requestId, documentKey, userId, SERVICE_SLUG);
  const document = await upsertServiceDocument({ requestId, documentKey, originalName: file.originalname,
    storedName: file.filename, mimeType: file.mimetype, size: file.size });
  return { document, previousStoredName: previous?.stored_name || null };
}
export const getUnIipDocument = (userId, requestId, documentKey) => findServiceDocument(requestId, documentKey, userId, SERVICE_SLUG);
export const removeUnIipDocument = (userId, requestId, documentKey) => deleteServiceDocument(requestId, documentKey, userId, SERVICE_SLUG);
