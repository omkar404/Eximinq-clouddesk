import API from "./api";
const basePath = "/service-store/dsc-services";
export const getDscServicesConfiguration = async () => (await API.get(basePath)).data;
export const getDscServicesQuote = async (applicantType,dscClass,dscType,validity) => (await API.post(`${basePath}/quote`, { applicantType,dscClass,dscType,validity })).data;
export const getDscServicesRequests = async () => (await API.get(`${basePath}/requests`)).data;
export const getDscServicesLedger = async () => (await API.get(`${basePath}/ledger`)).data;
export const saveDscServicesDraft = async (payload) => (await API.post(`${basePath}/drafts`, payload)).data;
export const submitDscServices = async (payload) => (await API.post(`${basePath}/submit`, payload)).data;
export async function uploadDscServicesDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeDscServicesDocument = async (requestId,key) => API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
export async function downloadDscServicesDocument(requestId,key,fileName){const response=await API.get(`${basePath}/requests/${requestId}/documents/${key}/download`,{responseType:"blob"});const url=URL.createObjectURL(response.data);const anchor=document.createElement("a");anchor.href=url;anchor.download=fileName||"document";document.body.appendChild(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);}
