import API from "./api";
const basePath = "/service-store/gst-lut-filing";
export const getGstLutConfiguration = async () => (await API.get(basePath)).data;
export const getGstLutQuote = async (requestType) => (await API.post(`${basePath}/quote`, { requestType })).data;
export const getGstLutRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getGstLutLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveGstLutDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitGstLut = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadGstLutDocument(requestId, documentKey, file) { const formData = new FormData(); formData.append("file", file); return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data; }
export const removeGstLutDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
