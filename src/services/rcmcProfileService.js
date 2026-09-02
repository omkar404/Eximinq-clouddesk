import API from "./interceptor";
const base="/client/statutory-profile/rcmc";
export const getRcmcMasters=async()=>(await API.get(`${base}/masters`)).data;
export const listRcmcApplications=async()=>(await API.get(base)).data;
export const createRcmcApplication=async(applicationType)=>(await API.post(base,{applicationType})).data;
export const getRcmcApplication=async id=>(await API.get(`${base}/${id}`)).data;
export const updateRcmcApplication=async(id,data)=>(await API.patch(`${base}/${id}`,data)).data;
export const addRcmcRecord=async(id,type,data)=>(await API.post(`${base}/${id}/${type}`,data)).data;
export const deleteRcmcRecord=(id,type,itemId)=>API.delete(`${base}/${id}/${type}/${itemId}`);
export const saveRcmcCountries=async(id,countries)=>(await API.put(`${base}/${id}/countries`,{countries})).data;
export const getRcmcQuote=async(id,data)=>(await API.post(`${base}/${id}/quote`,data)).data;
export const uploadRcmcAttachment=async(id,data)=>(await API.post(`${base}/${id}/attachments`,data,{headers:{"Content-Type":"multipart/form-data"}})).data;
export const deleteRcmcAttachment=(id,itemId)=>API.delete(`${base}/${id}/attachments/${itemId}`);
export const submitRcmcApplication=async id=>(await API.post(`${base}/${id}/submit`)).data;
export async function downloadRcmcAttachment(id,item){const r=await API.get(`${base}/${id}/attachments/${item.id}`,{responseType:"blob"}),url=URL.createObjectURL(r.data),a=window.document.createElement("a");a.href=url;a.download=item.original_name;a.click();URL.revokeObjectURL(url);}
