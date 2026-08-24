import API from "./api";
const basePath = "/service-store/fssai";
export const getFssaiConfiguration = async () => (await API.get(basePath)).data;
export const getFssaiQuote = async (requestMode) => (await API.post(`${basePath}/quote`, { requestMode })).data;
export const getFssaiRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getFssaiLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveFssaiDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitFssai = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadFssaiDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeFssaiDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
export async function downloadFssaiDocument(requestId,key,fileName){const response=await API.get(`${basePath}/requests/${requestId}/documents/${key}/download`,{responseType:"blob"});const url=URL.createObjectURL(response.data);const anchor=document.createElement("a");anchor.href=url;anchor.download=fileName||"document";document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);}
