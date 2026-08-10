import API from "./api";
const basePath = "/service-store/rex";
export const getRexConfiguration = async () => (await API.get(basePath)).data;
export const getRexQuote = async (requestType) => (await API.post(`${basePath}/quote`, { requestType })).data;
export const getRexRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getRexLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveRexDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitRex = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadRexDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeRexDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
