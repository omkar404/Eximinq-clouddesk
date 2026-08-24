import {
  addAgentWorkDocument, addClarificationDocument, assignRequest,
  completeAgentTask, createClarification, finalizeRequest,
  findAgentAssignment, findClientClarification, findWorkflowFile, findWorkflowRequest,
  getWorkflowRelations, listAdminWorkflowRequests, listAgents,
  listAgentTasks, listClientRequests, listNotifications,
  markNotificationRead, resubmitClarification, setAdminReview,
  startAgentTask, startRequestReview, updateAdminRequestStatus
} from "../models/requestWorkflow.model.js";

function httpError(status, message, details) {
  const error = new Error(message);
  error.status = status;
  error.details = details;
  return error;
}

function mapRequest(row) {
  const serviceConfig = row.service_config || {};
  return {
    id: row.id,
    requestCode: row.request_code,
    serviceSlug: row.service_slug,
    service: {
      name: serviceConfig.trackingName || row.service_name,
      category: row.service_category,
      configuration: serviceConfig
    },
    status: row.status,
    documentCount: Number(row.document_count || 0),
    formData: row.payload,
    pricing: row.pricing_snapshot,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    client: {
      id: row.client_id, name: row.client_name,
      email: row.client_email, code: row.client_code
    },
    assignment: row.assignment_id ? {
      id: row.assignment_id,
      agent: {
        id: row.agent_id, name: row.agent_name,
        email: row.agent_email, code: row.agent_code
      },
      instructions: row.assignment_instructions,
      dueDate: row.assignment_due_date,
      status: row.assignment_status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      completionNotes: row.completion_notes
    } : null
  };
}

function mapDocument(document, documentDefinitions = []) {
  const definition = documentDefinitions.find((item) => item.id === document.document_key);
  return {
    id: document.id,
    documentKey: document.document_key,
    label: document.document_label || definition?.label || document.document_key,
    name: document.original_name,
    mimeType: document.mime_type,
    size: Number(document.size_bytes),
    uploadedAt: document.uploaded_at
  };
}

async function withRelations(row) {
  if (!row) return null;
  const related = await getWorkflowRelations(row.id);
  const base = mapRequest(row);
  const documentDefinitions = base.service.configuration?.documents || [];
  return {
    ...base,
    documents: related.documents.map((document) => mapDocument(document, documentDefinitions)),
    clarifications: related.clarifications.map((item) => ({
      id: item.id,
      comments: item.comments,
      requestedDocuments: item.requested_documents,
      dueDate: item.due_date,
      status: item.status,
      requestedBy: item.requested_by_name,
      resubmittedAt: item.resubmitted_at,
      createdAt: item.created_at,
      documents: item.documents.map((document) => mapDocument(document))
    })),
    events: [
      ...(base.submittedAt ? [{
        id: `submitted-${base.id}`, status: "SUBMITTED",
        title: "Request submitted", comments: "",
        actorName: base.client.name, actorRole: "CLIENT", createdAt: base.submittedAt
      }] : []),
      ...related.events.map((event) => ({
        id: event.id, status: event.status, title: event.title,
        comments: event.comments, metadata: event.metadata,
        actorName: event.actor_name, actorRole: event.actor_role,
        createdAt: event.created_at
      }))
    ],
    workDocuments: related.workDocuments.map((document) => mapDocument(document)),
    transactions: related.transactions.map((transaction) => ({
      id: transaction.id, accountType: transaction.account_type,
      transactionType: transaction.transaction_type, amount: Number(transaction.amount),
      balanceAfter: Number(transaction.balance_after), description: transaction.description,
      status: transaction.status, transactionDate: transaction.created_at
    }))
  };
}

export async function getClientRequests(userId) {
  return (await listClientRequests(userId)).map(mapRequest);
}
export async function getClientRequest(requestId, userId) {
  return withRelations(await findWorkflowRequest(requestId, { clientId: userId }));
}
export async function getAdminWorkflowRequests(filters) {
  return (await listAdminWorkflowRequests(filters)).map(mapRequest);
}
export async function getAdminWorkflowRequest(requestId) {
  return withRelations(await findWorkflowRequest(requestId));
}
export async function getAgentTasks(agentId) {
  return (await listAgentTasks(agentId)).map(mapRequest);
}
export async function getAgentTask(requestId, agentId) {
  return withRelations(await findWorkflowRequest(requestId, { agentId }));
}
export { listAgents as getAvailableAgents, listNotifications as getNotifications, markNotificationRead };
export { findWorkflowFile as getWorkflowFile };

export async function requestAdditionalDocuments(input) {
  if (!input.comments?.trim()) throw httpError(422, "Add comments or instructions for the client");
  if (!Array.isArray(input.requestedDocuments) || !input.requestedDocuments.some((item) => String(item).trim())) {
    throw httpError(422, "Specify at least one required document");
  }
  const result = await createClarification({
    ...input,
    comments: input.comments.trim(),
    requestedDocuments: input.requestedDocuments.map((item) => String(item).trim()).filter(Boolean)
  });
  if (!result) throw httpError(409, "This request cannot ask for additional documents in its current status");
  return result;
}

const ADMIN_STATUS_ALIASES = {
  NEEDS_CLARIFICATION: "ADDITIONAL_DOCUMENTS_REQUESTED",
  ADDITIONAL_DOCUMENT_REQUESTED: "ADDITIONAL_DOCUMENTS_REQUESTED",
  APPROVED: "COMPLETED"
};

const ADMIN_STATUS_TRANSITIONS = {
  UNDER_REVIEW: ["SUBMITTED", "DOCUMENTS_RESUBMITTED"],
  REJECTED: ["SUBMITTED", "UNDER_REVIEW", "DOCUMENTS_RESUBMITTED", "ADMIN_REVIEW", "AGENT_COMPLETED"],
  COMPLETED: ["ADMIN_REVIEW", "AGENT_COMPLETED"]
};

export async function changeAdminRequestStatus(input) {
  const requestedStatus = String(input.status || "").trim().toUpperCase().replaceAll(" ", "_");
  const status = ADMIN_STATUS_ALIASES[requestedStatus] || requestedStatus;

  if (status === "ADDITIONAL_DOCUMENTS_REQUESTED") {
    const clarification = await requestAdditionalDocuments(input);
    return {
      status,
      clarification
    };
  }

  const allowedFrom = ADMIN_STATUS_TRANSITIONS[status];
  if (!allowedFrom) {
    throw httpError(422, "Unsupported status transition", {
      supportedStatuses: [
        "UNDER_REVIEW", "NEEDS_CLARIFICATION",
        "ADDITIONAL_DOCUMENTS_REQUESTED", "COMPLETED", "REJECTED"
      ]
    });
  }
  if (status === "REJECTED" && !input.comments?.trim()) {
    throw httpError(422, "Add a reason before rejecting this request");
  }

  const result = await updateAdminRequestStatus({
    requestId: input.requestId,
    adminId: input.adminId,
    status,
    comments: String(input.comments || "").trim(),
    allowedFrom
  });
  if (!result) {
    throw httpError(409, "This status change is not allowed from the request's current status");
  }
  return result;
}

export async function uploadClarificationFile({
  clarificationId, userId, documentLabel, file
}) {
  const clarification = await findClientClarification(clarificationId, userId);
  if (!clarification) throw httpError(404, "Document request not found");
  if (clarification.status !== "OPEN") throw httpError(409, "This document request is already resubmitted");
  return addClarificationDocument({
    clarificationId, userId,
    documentLabel: documentLabel?.trim() || file.originalname,
    originalName: file.originalname, storedName: file.filename,
    mimeType: file.mimetype, size: file.size
  });
}

export async function resubmitClientDocuments(input) {
  const result = await resubmitClarification(input);
  if (!result) throw httpError(409, "This document request is no longer open");
  return result;
}

export async function assignToAgent(input) {
  const result = await assignRequest(input);
  if (!result) throw httpError(409, "Select an active agent or check the request status");
  return result;
}

export async function beginRequestReview(input) {
  const result = await startRequestReview(input);
  if (!result) throw httpError(409, "This request cannot enter review in its current status");
  return result;
}

export async function beginAgentTask(input) {
  const result = await startAgentTask(input);
  if (!result) throw httpError(409, "This task cannot be started");
  return result;
}

export async function uploadAgentOutput({ requestId, agentId, file }) {
  const assignment = await findAgentAssignment(requestId, agentId);
  if (!assignment) throw httpError(404, "Assigned task not found");
  if (!["ASSIGNED", "IN_PROGRESS"].includes(assignment.status)) {
    throw httpError(409, "Output files cannot be changed after completion");
  }
  return addAgentWorkDocument({
    assignmentId: assignment.id, agentId,
    originalName: file.originalname, storedName: file.filename,
    mimeType: file.mimetype, size: file.size
  });
}

export async function finishAgentTask(input) {
  const result = await completeAgentTask(input);
  if (!result) throw httpError(409, "Start this task before marking it complete");
  return result;
}

export async function beginAdminReview(input) {
  const result = await setAdminReview(input);
  if (!result) throw httpError(409, "Agent work is not ready for admin review");
  return result;
}

export async function decideRequest(input) {
  if (!["APPROVED", "REJECTED"].includes(input.decision)) throw httpError(422, "Select approve or reject");
  const result = await finalizeRequest(input);
  if (!result) throw httpError(409, "This request cannot be finalized in its current status");
  return result;
}
