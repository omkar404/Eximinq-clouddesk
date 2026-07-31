import API from "./api";
const basePath = "/service-store/aqcs-pqms";
export const getAqcsPqmsConfiguration = async () => (await API.get(basePath)).data;
export const getAqcsPqmsQuote = async (requestMode, requestType, consignmentValue) => (await API.post(`${basePath}/quote`, { requestMode, requestType, consignmentValue })).data;
export const getAqcsPqmsRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getAqcsPqmsLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveAqcsPqmsDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitAqcsPqms = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadAqcsPqmsDocument(requestId, key, file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeAqcsPqmsDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
