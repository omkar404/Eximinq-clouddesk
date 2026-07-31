import API from "./api";
const basePath = "/service-store/igcr-return";
export const getIgcrConfiguration = async () => (await API.get(basePath)).data;
export const getIgcrQuote = async requestType => (await API.post(`${basePath}/quote`, { requestType })).data;
export const getIgcrRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getIgcrLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveIgcrDraft = async payload => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitIgcr = async payload => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadIgcrDocument(requestId, documentKey, file) { const formData = new FormData(); formData.append("file", file); return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data; }
export const removeIgcrDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
