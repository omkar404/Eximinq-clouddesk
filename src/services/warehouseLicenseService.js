import API from "./api";
const basePath = "/service-store/warehouse-license";
export const getWarehouseLicenseConfiguration = async () => (await API.get(basePath)).data;
export const getWarehouseLicenseQuote = async (requestType, totalCargoValue) => (await API.post(`${basePath}/quote`, { requestType, totalCargoValue })).data;
export const getWarehouseLicenseRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getWarehouseLicenseLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveWarehouseLicenseDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitWarehouseLicense = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadWarehouseLicenseDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeWarehouseLicenseDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
