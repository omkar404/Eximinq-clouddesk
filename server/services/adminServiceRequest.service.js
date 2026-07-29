import {
  findAdminRequestDocument,
  findAdminServiceRequest,
  listAdminServiceRequests,
  updateAdminServiceRequestStatus
} from "../models/adminServiceRequest.model.js";

function serializeRequest(row) {
  return {
    id: row.id,
    requestCode: row.request_code,
    serviceSlug: row.service_slug,
    status: row.status,
    formData: row.payload,
    pricing: row.pricing_snapshot,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    client: {
      id: row.client_id,
      name: row.client_name,
      email: row.client_email,
      code: row.client_code
    },
    service: {
      name: row.service_name,
      category: row.service_category,
      description: row.service_description
    },
    ...(row.documents
      ? {
          documents: row.documents.map((document) => ({
            id: document.id,
            documentKey: document.document_key,
            name: document.original_name,
            mimeType: document.mime_type,
            size: Number(document.size_bytes),
            uploadedAt: document.uploaded_at
          }))
        }
      : {}),
    ...(row.transactions
      ? {
          transactions: row.transactions.map((transaction) => ({
            id: transaction.id,
            accountType: transaction.account_type,
            transactionType: transaction.transaction_type,
            amount: Number(transaction.amount),
            balanceAfter: Number(transaction.balance_after),
            description: transaction.description,
            status: transaction.status,
            transactionDate: transaction.created_at
          }))
        }
      : {})
  };
}

export async function getAdminServiceRequests(filters) {
  return (await listAdminServiceRequests(filters)).map(serializeRequest);
}

export async function getAdminServiceRequest(requestId) {
  const request = await findAdminServiceRequest(requestId);
  return request ? serializeRequest(request) : null;
}

export function changeAdminServiceRequestStatus(requestId, status) {
  return updateAdminServiceRequestStatus(requestId, status);
}

export function getAdminRequestDocument(requestId, documentId) {
  return findAdminRequestDocument(requestId, documentId);
}
