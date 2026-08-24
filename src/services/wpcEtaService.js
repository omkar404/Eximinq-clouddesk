import API from "./api";
const basePath = "/service-store/wpc-licence";
export const getWpcEtaConfiguration = async () => (await API.get(basePath)).data;
export const getWpcEtaQuote = async (requestMode) => (await API.post(`${basePath}/quote`, { requestMode })).data;
export const getWpcEtaRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getWpcEtaLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveWpcEtaDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitWpcEta = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadWpcEtaDocument(requestId, documentKey, file) {
  const formData = new FormData(); formData.append("file", file);
  return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data;
}
export const removeWpcEtaDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
export async function downloadWpcEtaDocument(requestId, documentKey, fileName) {
  const response = await API.get(`${basePath}/requests/${requestId}/documents/${documentKey}/download`, { responseType: "blob" });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "wpc-document";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
