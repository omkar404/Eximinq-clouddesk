import API from "./api";

const basePath = "/service-store/industrial-licence";

export const getIndustrialLicenseConfiguration = async () => (await API.get(basePath)).data;
export const getIndustrialLicenseQuote = async (requestType) => (await API.post(`${basePath}/quote`, { requestType })).data;
export const getIndustrialLicenseRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getIndustrialLicenseLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveIndustrialLicenseDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitIndustrialLicense = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadIndustrialLicenseDocument(requestId, documentKey, file) {
  const formData = new FormData();
  formData.append("file", file);
  return (await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`, formData)).data;
}
export const removeIndustrialLicenseDocument = async (requestId, documentKey) =>
  API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
