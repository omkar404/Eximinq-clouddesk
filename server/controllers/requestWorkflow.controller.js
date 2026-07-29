import { unlink } from "node:fs/promises";
import { resolve } from "node:path";
import {
  assignToAgent, beginAdminReview, beginAgentTask, beginRequestReview, decideRequest,
  finishAgentTask, getAdminWorkflowRequest, getAdminWorkflowRequests,
  getAgentTask, getAgentTasks, getAvailableAgents, getClientRequest,
  getClientRequests, getNotifications, getWorkflowFile, markNotificationRead,
  requestAdditionalDocuments, resubmitClientDocuments,
  uploadAgentOutput, uploadClarificationFile, changeAdminRequestStatus
} from "../services/requestWorkflow.service.js";

const removeUpload = (file) => file?.path && unlink(file.path).catch(() => {});
const uploadDirectories = {
  "certificate-of-origin": resolve("server/uploads/certificate-of-origin"),
  "iem-registration": resolve("server/uploads/iem-registration"),
  "industrial-licence": resolve("server/uploads/industrial-licence")
};

export async function clientList(req, res, next) {
  try { res.json({ requests: await getClientRequests(req.user.id) }); } catch (error) { next(error); }
}
export async function clientDetail(req, res, next) {
  try {
    const request = await getClientRequest(req.params.requestId, req.user.id);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ request });
  } catch (error) { next(error); }
}
export async function clarificationUpload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Select a document" });
    const document = await uploadClarificationFile({
      clarificationId: req.params.clarificationId, userId: req.user.id,
      documentLabel: req.body.documentLabel, file: req.file
    });
    res.status(201).json({ document });
  } catch (error) {
    await removeUpload(req.file);
    next(error);
  }
}
export async function clarificationResubmit(req, res, next) {
  try {
    res.json(await resubmitClientDocuments({
      clarificationId: req.params.clarificationId,
      userId: req.user.id, comments: String(req.body.comments || "")
    }));
  } catch (error) { next(error); }
}
export async function notifications(req, res, next) {
  try { res.json({ notifications: await getNotifications(req.user.id) }); } catch (error) { next(error); }
}
export async function notificationRead(req, res, next) {
  try {
    const item = await markNotificationRead(req.params.notificationId, req.user.id);
    if (!item) return res.status(404).json({ message: "Notification not found" });
    res.json({ notification: item });
  } catch (error) { next(error); }
}
export async function fileDownload(req, res, next) {
  try {
    const access = req.user.role === "CLIENT" ? { clientId: req.user.id }
      : req.user.role === "AGENT" ? { agentId: req.user.id } : {};
    const file = await getWorkflowFile({
      requestId: req.params.requestId, fileId: req.params.fileId,
      kind: req.params.kind, ...access
    });
    if (!file) return res.status(404).json({ message: "Document not found" });
    const directory = req.params.kind === "original"
      ? uploadDirectories[file.service_slug]
      : resolve("server/uploads/workflow");
    if (!directory) return res.status(404).json({ message: "Document storage not found" });
    res.download(resolve(directory, file.stored_name), file.original_name);
  } catch (error) { next(error); }
}
export async function adminList(req, res, next) {
  try {
    res.json({ requests: await getAdminWorkflowRequests({
      search: String(req.query.search || "").trim(),
      status: String(req.query.status || "").toUpperCase()
    }) });
  } catch (error) { next(error); }
}
export async function adminDetail(req, res, next) {
  try {
    const request = await getAdminWorkflowRequest(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    res.json({ request });
  } catch (error) { next(error); }
}
export async function agents(req, res, next) {
  try { res.json({ agents: await getAvailableAgents() }); } catch (error) { next(error); }
}
export async function clarificationCreate(req, res, next) {
  try {
    const clarification = await requestAdditionalDocuments({
      requestId: req.params.requestId, adminId: req.user.id,
      comments: String(req.body.comments || ""),
      requestedDocuments: req.body.requestedDocuments,
      dueDate: req.body.dueDate || null
    });
    res.status(201).json({ clarification });
  } catch (error) { next(error); }
}
export async function adminStatusUpdate(req, res, next) {
  try {
    const result = await changeAdminRequestStatus({
      requestId: req.params.requestId,
      adminId: req.user.id,
      status: req.body.status,
      comments: String(req.body.comments || ""),
      requestedDocuments: req.body.requestedDocuments,
      dueDate: req.body.dueDate || null
    });
    const request = await getAdminWorkflowRequest(req.params.requestId);
    res.json({ request, result });
  } catch (error) { next(error); }
}
export async function assignmentCreate(req, res, next) {
  try {
    const assignment = await assignToAgent({
      requestId: req.params.requestId, adminId: req.user.id,
      agentId: req.body.agentId, instructions: String(req.body.instructions || ""),
      dueDate: req.body.dueDate || null
    });
    res.status(201).json({ assignment });
  } catch (error) { next(error); }
}
export async function requestReview(req, res, next) {
  try {
    res.json({ request: await beginRequestReview({
      requestId: req.params.requestId, adminId: req.user.id
    }) });
  } catch (error) { next(error); }
}
export async function adminReview(req, res, next) {
  try {
    res.json({ request: await beginAdminReview({
      requestId: req.params.requestId, adminId: req.user.id
    }) });
  } catch (error) { next(error); }
}
export async function adminDecision(req, res, next) {
  try {
    res.json({ request: await decideRequest({
      requestId: req.params.requestId, adminId: req.user.id,
      decision: String(req.body.decision || "").toUpperCase(),
      comments: String(req.body.comments || "")
    }) });
  } catch (error) { next(error); }
}
export async function agentList(req, res, next) {
  try { res.json({ tasks: await getAgentTasks(req.user.id) }); } catch (error) { next(error); }
}
export async function agentDetail(req, res, next) {
  try {
    const task = await getAgentTask(req.params.requestId, req.user.id);
    if (!task) return res.status(404).json({ message: "Assigned task not found" });
    res.json({ task });
  } catch (error) { next(error); }
}
export async function agentStart(req, res, next) {
  try {
    res.json({ assignment: await beginAgentTask({
      requestId: req.params.requestId, agentId: req.user.id
    }) });
  } catch (error) { next(error); }
}
export async function agentOutputUpload(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ message: "Select an output document" });
    const document = await uploadAgentOutput({
      requestId: req.params.requestId, agentId: req.user.id, file: req.file
    });
    res.status(201).json({ document });
  } catch (error) {
    await removeUpload(req.file);
    next(error);
  }
}
export async function agentComplete(req, res, next) {
  try {
    res.json({ assignment: await finishAgentTask({
      requestId: req.params.requestId, agentId: req.user.id,
      notes: String(req.body.notes || "")
    }) });
  } catch (error) { next(error); }
}
