import API from "./api";
const basePath="/service-store/ca-certification";
export const getCaCertificationConfiguration=async()=>(await API.get(basePath)).data;
export const getCaCertificationQuote=async input=>(await API.post(`${basePath}/quote`,input)).data;
export const getCaCertificationRequests=async()=>(await API.get(`${basePath}/requests`)).data;
export const getCaCertificationLedger=async()=>(await API.get(`${basePath}/ledger`)).data;
export const saveCaCertificationDraft=async payload=>(await API.post(`${basePath}/drafts`,payload)).data;
export const submitCaCertification=async payload=>(await API.post(`${basePath}/submit`,payload)).data;
export async function uploadCaCertificationDocument(requestId,documentKey,file){const formData=new FormData();formData.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`,formData)).data;}
export const removeCaCertificationDocument=async(requestId,documentKey)=>API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
