import {
  getClientOperationalMetadata,
  getClientOperationsTransactions,
  getSchemeCatalog
} from "../models/clientOperations.model.js";
import { listClientRequests } from "../models/requestWorkflow.model.js";

const number = (value) => Number(value || 0);
const firstNumber = (...values) => {
  const value = values.find((item) => item !== "" && item != null && Number.isFinite(Number(item)));
  return number(value);
};
const title = (value = "") => String(value).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function optionLabel(config, value) {
  for (const collection of Object.values(config || {})) {
    if (!Array.isArray(collection)) continue;
    const option = collection.find((item) => item && typeof item === "object" && (item.id ?? item.value) === value);
    if (option?.label) return option.label;
  }
  return value;
}

function requestFields(row) {
  const payload = row.payload?.form && typeof row.payload.form === "object" ? row.payload.form : row.payload || {};
  return Object.entries(payload).filter(([key, value]) => !["requestId", "documents"].includes(key) && value !== "" && value != null).map(([key, value]) => ({
    key, label: title(key), value: optionLabel(row.service_config, value)
  }));
}

function mapRequest(row) {
  const pricing = row.pricing_snapshot || {};
  const total = number(pricing.total || row.paid_amount);
  return {
    id: row.id,
    requestCode: row.request_code,
    serviceSlug: row.service_slug,
    serviceName: row.service_config?.trackingName || row.service_name,
    category: row.service_category,
    status: row.status,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    documentCount: row.document_count,
    eventCount: row.event_count,
    total,
    officialFee: number(pricing.officialFee),
    serviceCharge: firstNumber(pricing.serviceCharge, pricing.draftingFee, pricing.professionalFee, pricing.serviceFee),
    gst: number(pricing.gst),
    paymentStatus: total <= 0 ? "QUOTE PENDING" : number(row.paid_amount) >= total ? "PAID" : "PARTIALLY PAID",
    assignment: row.agent_name ? {
      agentName: row.agent_name, status: row.assignment_status,
      dueDate: row.assignment_due_date, startedAt: row.started_at, completedAt: row.completed_at
    } : null,
    fields: requestFields(row)
  };
}

export async function getClientOperations(userId) {
  const [canonicalRows, metadataRows, catalog, transactions] = await Promise.all([
    listClientRequests(userId), getClientOperationalMetadata(userId),
    getSchemeCatalog(), getClientOperationsTransactions(userId)
  ]);
  const metadataByRequest = new Map(metadataRows.map((row) => [String(row.id), row]));
  const rows = canonicalRows.map((row) => ({
    ...row,
    ...(metadataByRequest.get(String(row.id)) || {})
  }));
  const requests = rows.map(mapRequest);
  const applicationsBySlug = new Map();
  requests.forEach((request) => {
    if (!applicationsBySlug.has(request.serviceSlug)) applicationsBySlug.set(request.serviceSlug, request);
  });
  const schemes = catalog.map((item) => {
    const application = applicationsBySlug.get(item.slug);
    return {
      slug: item.slug,
      name: item.config?.trackingName || item.name,
      category: item.category,
      description: item.description,
      status: application?.status || "NOT APPLIED",
      requestCode: application?.requestCode || null,
      submittedAt: application?.submittedAt || null,
      updatedAt: application?.updatedAt || null
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    invoices: requests.map((request) => ({ ...request, billingReference: request.requestCode })),
    workflows: requests,
    schemes,
    transactions: transactions.map((item) => ({
      id: item.id, requestId: item.service_request_id, accountType: item.account_type,
      transactionType: item.transaction_type, amount: number(item.amount),
      balanceAfter: number(item.balance_after), description: item.description,
      status: item.status, createdAt: item.created_at
    }))
  };
}
