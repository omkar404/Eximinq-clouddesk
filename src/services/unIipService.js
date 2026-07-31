import API from "./api";
const basePath = "/service-store/un-iip-certificate";
export const getUnIipConfiguration = async () => (await API.get(basePath)).data;
export const getUnIipQuote = async (requestType) => (await API.post(`${basePath}/quote`, { requestType })).data;
export const getUnIipRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getUnIipLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveUnIipDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitUnIip = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadUnIipDocument(requestId, documentKey, file) { const formData = new FormData(); formData.append("file", file); return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data; }
export const removeUnIipDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
