import API from "./api";
const basePath = "/service-store/gst-return";
export const getGstReturnsConfiguration = async () => (await API.get(basePath)).data;
export const getGstReturnsQuote = async (returnType) => (await API.post(`${basePath}/quote`, { returnType })).data;
export const getGstReturnsRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getGstReturnsLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveGstReturnsDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitGstReturns = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadGstReturnsDocument(requestId, documentKey, file) { const formData = new FormData(); formData.append("file", file); return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data; }
export const removeGstReturnsDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
