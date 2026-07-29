import {
  createServiceRequest, deleteServiceDocument, findFinancialContext,
  findServiceDefinition, findServiceDocument, findServiceRequest,
  listServiceRequests, submitServiceRequestAndDeduct, updateServiceDraft,
  upsertServiceDocument
} from "../models/serviceRequest.model.js";
import { listFinancialTransactions } from "../models/certificateOfOrigin.model.js";

const SERVICE_SLUG = "iem-registration";

function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

async function definition() {
  const result = await findServiceDefinition(SERVICE_SLUG);
  if (!result) throw httpError(404, "IEM Registration service is unavailable");
  return result;
}

function pricing(config, filingPart) {
  const selected = config?.pricing?.[filingPart];
  if (!selected) throw httpError(400, "IEM pricing is unavailable for the selected filing part");
  const officialFee = Number(selected.officialFee || 0);
  const serviceCharge = Number(selected.serviceCharge || 0);
  const gstRate = Number(selected.gstRate || 0);
  const gst = Number((serviceCharge * gstRate / 100).toFixed(2));
  return {
    currency: config.currency || "INR", officialFee, serviceCharge, gstRate, gst,
    total: Number((officialFee + serviceCharge + gst).toFixed(2))
  };
}

export async function getIemConfiguration(userId) {
  const [serviceDefinition, finances] = await Promise.all([definition(), findFinancialContext(userId)]);
  return {
    service: {
      slug: serviceDefinition.slug, category: serviceDefinition.category,
      name: serviceDefinition.name, description: serviceDefinition.description,
      ...serviceDefinition.config
    },
    financialContext: {
      walletBalance: Number(finances.wallet_balance || 0),
      creditLineBalance: Number(finances.credit_line_balance || 0),
      creditLimit: Number(finances.credit_limit || 0)
    }
  };
}

export async function getIemQuote(userId, filingPart) {
  const { service, financialContext } = await getIemConfiguration(userId);
  const quote = pricing(service, filingPart);
  return {
    ...quote,
    openingWalletBalance: financialContext.walletBalance,
    closingWalletBalance: Number((financialContext.walletBalance - quote.officialFee).toFixed(2)),
    currentCreditLimit: financialContext.creditLineBalance,
    availableCreditAfter: Number((financialContext.creditLineBalance - quote.serviceCharge - quote.gst).toFixed(2))
  };
}

export async function saveIemDraft(userId, payload) {
  const pricingSnapshot = await getIemQuote(userId, payload.filingPart);
  if (payload.requestId) {
    const current = await findServiceRequest(payload.requestId, userId, SERVICE_SLUG);
    if (!current) throw httpError(404, "IEM draft not found");
    if (current.status !== "DRAFT") throw httpError(409, "Submitted requests can no longer be edited");
    const updated = await updateServiceDraft({
      requestId: payload.requestId, userId, serviceSlug: SERVICE_SLUG, payload, pricingSnapshot
    });
    if (!updated) throw httpError(409, "IEM draft is no longer editable");
    return updated;
  }
  return createServiceRequest({ userId, serviceSlug: SERVICE_SLUG, payload, pricingSnapshot });
}

export async function submitIemRequest(userId, payload) {
  const [serviceDefinition, pricingSnapshot] = await Promise.all([
    definition(), getIemQuote(userId, payload.filingPart)
  ]);
  try {
    return await submitServiceRequestAndDeduct({
      userId, requestId: payload.requestId, serviceSlug: SERVICE_SLUG,
      payload, pricingSnapshot, serviceName: serviceDefinition.name
    });
  } catch (error) {
    if (error.code?.startsWith("INSUFFICIENT_")) {
      throw httpError(402, "Available balance is insufficient", { code: error.code, ...error.balanceDetails });
    }
    if (error.code === "REQUEST_NOT_EDITABLE") throw httpError(409, error.message);
    throw error;
  }
}

export function getIemRequests(userId) {
  return listServiceRequests(userId, SERVICE_SLUG);
}

export async function getIemLedger(userId) {
  const [finances, transactions] = await Promise.all([
    findFinancialContext(userId), listFinancialTransactions(userId)
  ]);
  return {
    balances: {
      walletBalance: Number(finances.wallet_balance || 0),
      creditLineBalance: Number(finances.credit_line_balance || 0),
      creditLimit: Number(finances.credit_limit || 0)
    },
    transactions: transactions.map((item) => ({
      id: item.id, accountType: item.account_type, transactionType: item.transaction_type,
      amount: Number(item.amount), balanceAfter: Number(item.balance_after),
      description: item.description, status: item.status, transactionDate: item.created_at,
      requestCode: item.request_code, serviceName: item.service_name
    }))
  };
}

export async function storeIemDocument({ userId, requestId, documentKey, file }) {
  const [request, serviceDefinition] = await Promise.all([
    findServiceRequest(requestId, userId, SERVICE_SLUG), definition()
  ]);
  if (!request) throw httpError(404, "IEM draft not found");
  if (request.status !== "DRAFT") throw httpError(409, "Documents cannot be changed after submission");
  if (!serviceDefinition.config?.documents?.some((item) => item.id === documentKey)) {
    throw httpError(400, "Unknown IEM document type");
  }
  const previous = await findServiceDocument(requestId, documentKey, userId, SERVICE_SLUG);
  const document = await upsertServiceDocument({
    requestId, documentKey, originalName: file.originalname, storedName: file.filename,
    mimeType: file.mimetype, size: file.size
  });
  return { document, previousStoredName: previous?.stored_name || null };
}

export const getIemDocument = (userId, requestId, documentKey) =>
  findServiceDocument(requestId, documentKey, userId, SERVICE_SLUG);
export const removeIemDocument = (userId, requestId, documentKey) =>
  deleteServiceDocument(requestId, documentKey, userId, SERVICE_SLUG);
