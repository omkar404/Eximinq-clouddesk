import API from "./api";
const basePath="/service-store/lmpc";
export const getLmpcConfiguration=async()=>(await API.get(basePath)).data;
export const getLmpcQuote=async input=>(await API.post(`${basePath}/quote`,input)).data;
export const getLmpcRequests=async()=>(await API.get(`${basePath}/requests`)).data;
export const getLmpcLedger=async()=>(await API.get(`${basePath}/ledger`)).data;
export const saveLmpcDraft=async payload=>(await API.post(`${basePath}/drafts`,payload)).data;
export const submitLmpc=async payload=>(await API.post(`${basePath}/submit`,payload)).data;
export async function uploadLmpcDocument(requestId,documentKey,file){const formData=new FormData();formData.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`,formData)).data;}
export const removeLmpcDocument=async(requestId,documentKey)=>API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
