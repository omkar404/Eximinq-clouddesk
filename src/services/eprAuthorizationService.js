import API from "./api";
const basePath = "/service-store/epr-authorisation";
export const getEprConfiguration = async () => (await API.get(basePath)).data;
export const getEprQuote = async (input) =>
  (await API.post(`${basePath}/quote`, input)).data;
export const getEprRequests = async () =>
  (await API.get(`${basePath}/requests`)).data;
export const getEprLedger = async () =>
  (await API.get(`${basePath}/ledger`)).data;
export const saveEprDraft = async (payload) =>
  (await API.post(`${basePath}/drafts`, payload)).data;
export const submitEpr = async (payload) =>
  (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadEprDocument(requestId, documentKey, file) {
  const formData = new FormData();
  formData.append("file", file);
  return (
    await API.post(
      `${basePath}/drafts/${requestId}/documents/${documentKey}`,
      formData,
    )
  ).data;
}
export const removeEprDocument = async (requestId, documentKey) =>
  API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
