import {
  createCertificateOfOriginRequest,
  deleteRequestDocument,
  findCertificateOfOriginDefinition,
  findCertificateOfOriginRequest,
  findClientFinancialContext,
  findRequestDocument,
  listFinancialTransactions,
  listCertificateOfOriginRequests,
  submitRequestAndDeductBalances,
  updateCertificateOfOriginRequest,
  upsertRequestDocument
} from "../models/certificateOfOrigin.model.js";

function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function getPricing(config, certificateType) {
  const pricing = config?.pricing?.[certificateType];
  if (!pricing) {
    throw httpError(400, "Pricing is unavailable for the selected certificate type");
  }

  const officialFee = Number(pricing.officialFee || 0);
  const serviceCharge = Number(pricing.serviceCharge || 0);
  const gstRate = Number(pricing.gstRate || 0);
  const gst = Number((serviceCharge * gstRate / 100).toFixed(2));

  return {
    currency: config.currency || "INR",
    officialFee,
    serviceCharge,
    gstRate,
    gst,
    total: Number((officialFee + serviceCharge + gst).toFixed(2))
  };
}

async function getDefinitionOrThrow() {
  const definition = await findCertificateOfOriginDefinition();
  if (!definition) {
    throw httpError(404, "Certificate of Origin service is unavailable");
  }
  return definition;
}

export async function getCertificateOfOriginConfiguration(userId) {
  const [definition, financialContext] = await Promise.all([
    getDefinitionOrThrow(),
    findClientFinancialContext(userId)
  ]);
  const walletBalance = Number(financialContext.wallet_balance || 0);
  const creditLineBalance = Number(financialContext.credit_line_balance || 0);

  return {
    service: {
      slug: definition.slug,
      category: definition.category,
      name: definition.name,
      description: definition.description,
      ...definition.config
    },
    financialContext: {
      walletBalance,
      creditLineBalance,
      creditLimit: Number(financialContext.credit_limit || 0)
    }
  };
}

export async function buildCertificateOfOriginQuote(userId, certificateType) {
  const { service, financialContext } = await getCertificateOfOriginConfiguration(userId);
  const pricing = getPricing(service, certificateType);

  return {
    ...pricing,
    openingWalletBalance: financialContext.walletBalance,
    closingWalletBalance: Number(
      (financialContext.walletBalance - pricing.officialFee).toFixed(2)
    ),
    currentCreditLimit: financialContext.creditLineBalance,
    availableCreditAfter: Number(
      (financialContext.creditLineBalance - pricing.serviceCharge - pricing.gst).toFixed(2)
    )
  };
}

export async function saveCertificateOfOriginRequest(userId, payload, status) {
  const quote = await buildCertificateOfOriginQuote(userId, payload.certificateType);
  if (status === "SUBMITTED") {
    const definition = await getDefinitionOrThrow();
    try {
      return await submitRequestAndDeductBalances({
        userId,
        requestId: payload.requestId,
        payload,
        pricingSnapshot: quote,
        serviceName: definition.name
      });
    } catch (error) {
      if (error.code?.startsWith("INSUFFICIENT_")) {
        throw httpError(402, "Available balance is insufficient", {
          code: error.code,
          ...error.balanceDetails
        });
      }
      if (error.code === "REQUEST_NOT_EDITABLE") {
        throw httpError(409, error.message);
      }
      throw error;
    }
  }

  const requestData = {
    userId,
    status,
    payload,
    pricingSnapshot: quote
  };

  if (payload.requestId) {
    const existing = await findCertificateOfOriginRequest(payload.requestId, userId);
    if (!existing) throw httpError(404, "Certificate of Origin request not found");
    if (existing.status !== "DRAFT") {
      throw httpError(409, "Submitted requests can no longer be edited");
    }

    return updateCertificateOfOriginRequest({
      requestId: payload.requestId,
      ...requestData
    });
  }

  return createCertificateOfOriginRequest(requestData);
}

export function getCertificateOfOriginRequests(userId) {
  return listCertificateOfOriginRequests(userId);
}

export async function getCertificateOfOriginLedger(userId) {
  const financialContext = await findClientFinancialContext(userId);
  const transactions = await listFinancialTransactions(userId);

  return {
    balances: {
      walletBalance: Number(financialContext.wallet_balance || 0),
      creditLineBalance: Number(financialContext.credit_line_balance || 0),
      creditLimit: Number(financialContext.credit_limit || 0)
    },
    transactions: transactions.map((transaction) => ({
      id: transaction.id,
      accountType: transaction.account_type,
      transactionType: transaction.transaction_type,
      amount: Number(transaction.amount),
      balanceAfter: Number(transaction.balance_after),
      description: transaction.description,
      status: transaction.status,
      transactionDate: transaction.created_at,
      requestCode: transaction.request_code,
      serviceName: transaction.service_name
    }))
  };
}

export async function storeCertificateOfOriginDocument({
  userId,
  requestId,
  documentKey,
  file
}) {
  const [request, definition] = await Promise.all([
    findCertificateOfOriginRequest(requestId, userId),
    getDefinitionOrThrow()
  ]);
  if (!request) throw httpError(404, "Certificate of Origin draft not found");
  if (request.status !== "DRAFT") {
    throw httpError(409, "Documents cannot be changed after submission");
  }

  const allowedDocument = definition.config?.documents?.some(
    (document) => document.id === documentKey
  );
  if (!allowedDocument) throw httpError(400, "Unknown supporting document type");

  const previous = await findRequestDocument(requestId, documentKey, userId);
  const document = await upsertRequestDocument({
    requestId,
    documentKey,
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size
  });

  return { document, previousStoredName: previous?.stored_name || null };
}

export function getCertificateOfOriginDocument(userId, requestId, documentKey) {
  return findRequestDocument(requestId, documentKey, userId);
}

export function removeCertificateOfOriginDocument(userId, requestId, documentKey) {
  return deleteRequestDocument(requestId, documentKey, userId);
}
