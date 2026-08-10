import API from "./api";
const basePath = "/service-store/factory-license";
export const getFactoryLicenseConfiguration = async () => (await API.get(basePath)).data;
export const getFactoryLicenseQuote = async (requestType, estimatedMonthlyContainers) => (await API.post(`${basePath}/quote`, { requestType, estimatedMonthlyContainers })).data;
export const getFactoryLicenseRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getFactoryLicenseLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveFactoryLicenseDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitFactoryLicense = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadFactoryLicenseDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeFactoryLicenseDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
