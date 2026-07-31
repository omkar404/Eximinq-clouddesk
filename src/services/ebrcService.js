import API from "./api";
const basePath="/service-store/ebrc";
export const getEbrcConfiguration=async()=>(await API.get(basePath)).data;
export const getEbrcQuote=async(ebrcType)=>(await API.post(`${basePath}/quote`,{ebrcType})).data;
export const getEbrcRequests=async()=>(await API.get(`${basePath}/requests`)).data;
export const getEbrcLedger=async()=>(await API.get(`${basePath}/ledger`)).data;
export const saveEbrcDraft=async(payload)=>(await API.post(`${basePath}/drafts`,payload)).data;
export const submitEbrc=async(payload)=>(await API.post(`${basePath}/submit`,payload)).data;
export async function uploadEbrcDocument(requestId,key,file){const data=new FormData();data.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${key}`,data)).data;}
export const removeEbrcDocument=async(requestId,key)=>API.delete(`${basePath}/drafts/${requestId}/documents/${key}`);
