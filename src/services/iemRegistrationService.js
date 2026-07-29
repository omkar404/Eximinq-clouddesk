import API from "./api";

const basePath = "/service-store/iem-registration";

export const getIemConfiguration = async () => (await API.get(basePath)).data;
export const getIemQuote = async (filingPart) => (await API.post(`${basePath}/quote`, { filingPart })).data;
export const getIemRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getIemLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveIemDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitIem = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadIemDocument(requestId, documentKey, file) {
  const formData = new FormData();
  formData.append("file", file);
  return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data;
}
export const removeIemDocument = async (requestId, documentKey) =>
  API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
