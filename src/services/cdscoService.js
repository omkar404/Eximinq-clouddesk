import API from "./api";
const basePath = "/service-store/cdsco-drug-control";
export const getCdscoConfiguration = async () => (await API.get(basePath)).data;
export const getCdscoQuote = async (requestMode, deviceClass) => (await API.post(`${basePath}/quote`, { requestMode, deviceClass })).data;
export const getCdscoRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getCdscoLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveCdscoDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitCdsco = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadCdscoDocument(requestId, documentKey, file) { const formData = new FormData(); formData.append("file", file); return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data; }
export const removeCdscoDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
