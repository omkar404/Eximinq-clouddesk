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
export async function downloadBisDocument(requestId,key,name){const response=await API.get(`${basePath}/requests/${requestId}/documents/${key}/download`,{responseType:"blob"});const url=URL.createObjectURL(response.data);const link=document.createElement("a");link.href=url;link.download=name||"bis-document";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}
