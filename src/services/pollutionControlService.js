import API from "./api";
const basePath="/service-store/pollution-control";
export const getPollutionConfiguration=async()=>(await API.get(basePath)).data;
export const getPollutionQuote=async input=>(await API.post(`${basePath}/quote`,input)).data;
export const getPollutionRequests=async()=>(await API.get(`${basePath}/requests`)).data;
export const getPollutionLedger=async()=>(await API.get(`${basePath}/ledger`)).data;
export const savePollutionDraft=async payload=>(await API.post(`${basePath}/drafts`,payload)).data;
export const submitPollution=async payload=>(await API.post(`${basePath}/submit`,payload)).data;
export async function uploadPollutionDocument(requestId,documentKey,file){const formData=new FormData();formData.append("file",file);return(await API.post(`${basePath}/drafts/${requestId}/documents/${documentKey}`,formData)).data;}
export const removePollutionDocument=async(requestId,documentKey)=>API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
