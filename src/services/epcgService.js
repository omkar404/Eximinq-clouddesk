import API from "./api";

const basePath = "/service-store/epcg";
export const getEpcgConfiguration = async () => (await API.get(basePath)).data;
export const getEpcgQuote = async (epcgType, dutyValue) => (await API.post(`${basePath}/quote`, { epcgType, dutyValue })).data;
export const getEpcgRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getEpcgLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveEpcgDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitEpcg = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadEpcgDocument(requestId, documentKey, file) {
  const formData = new FormData(); formData.append("file", file);
  return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data;
}
export const removeEpcgDocument = async (requestId, documentKey) => API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
