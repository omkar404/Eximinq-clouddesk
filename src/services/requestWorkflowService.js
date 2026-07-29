import api from "./api";

export const listClientTrackedRequests = async () =>
  (await api.get("/client/track-requests")).data;
export const getClientTrackedRequest = async (id) =>
  (await api.get(`/client/track-requests/${id}`)).data;
export const uploadClarificationDocument = async (clarificationId, file, documentLabel) => {
  const body = new FormData();
  body.append("file", file);
  body.append("documentLabel", documentLabel);
  return (await api.post(`/client/track-requests/clarifications/${clarificationId}/documents`, body)).data;
};
export const resubmitClarification = async (clarificationId, comments = "") =>
  (await api.post(`/client/track-requests/clarifications/${clarificationId}/resubmit`, { comments })).data;
export const listClientNotifications = async () =>
  (await api.get("/client/track-requests/notifications")).data;

export const listWorkflowAdminRequests = async (params = {}) =>
  (await api.get("/admin/workflow-requests", { params })).data;
export const getWorkflowAdminRequest = async (id) =>
  (await api.get(`/admin/workflow-requests/${id}`)).data;
export const listAvailableAgents = async () =>
  (await api.get("/admin/workflow-requests/agents")).data;
export const createDocumentRequest = async (id, payload) =>
  (await api.post(`/admin/workflow-requests/${id}/clarifications`, payload)).data;
export const updateWorkflowRequestStatus = async (id, payload) =>
  (await api.patch(`/admin/workflow-requests/${id}/status`, payload)).data;
export const startRequestReview = async (id) =>
  (await api.post(`/admin/workflow-requests/${id}/review`)).data;
export const assignWorkflowAgent = async (id, payload) =>
  (await api.post(`/admin/workflow-requests/${id}/assign`, payload)).data;
export const startAdminReview = async (id) =>
  (await api.post(`/admin/workflow-requests/${id}/admin-review`)).data;
export const decideWorkflowRequest = async (id, payload) =>
  (await api.post(`/admin/workflow-requests/${id}/decision`, payload)).data;

export const listAgentTasks = async () => (await api.get("/agent/tasks")).data;
export const getAgentTask = async (id) => (await api.get(`/agent/tasks/${id}`)).data;
export const startAgentTask = async (id) => (await api.post(`/agent/tasks/${id}/start`)).data;
export const uploadAgentOutput = async (id, file) => {
  const body = new FormData();
  body.append("file", file);
  return (await api.post(`/agent/tasks/${id}/outputs`, body)).data;
};
export const completeAgentTask = async (id, notes) =>
  (await api.post(`/agent/tasks/${id}/complete`, { notes })).data;

export const downloadWorkflowFile = async ({ role, requestId, kind, fileId, name }) => {
  const base = role === "admin" ? "/admin/workflow-requests"
    : role === "agent" ? "/agent/tasks" : "/client/track-requests";
  const response = await api.get(`${base}/${requestId}/files/${kind}/${fileId}`, { responseType: "blob" });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name || "document";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
