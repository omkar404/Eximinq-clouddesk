import API from "./api";
const basePath = "/service-store/bis";
export const getBisConfiguration = async () => (await API.get(basePath)).data;
export const getBisQuote = async (requestMode) => (await API.post(`${basePath}/quote`, { requestMode })).data;
export const getBisRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getBisLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveBisDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitBis = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadBisDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeBisDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
