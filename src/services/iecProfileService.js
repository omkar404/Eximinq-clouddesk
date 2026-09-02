import API from "./interceptor";
const base = "/client/statutory-profile/iec";
export const listIecApplications = () => API.get(base).then((r) => r.data);
export const createIecApplication = () => API.post(base).then((r) => r.data);
export const getIecApplication = (id) => API.get(`${base}/${id}`).then((r) => r.data);
export const updateIecApplication = (id, data) => API.patch(`${base}/${id}`, data).then((r) => r.data);
export const addIecItem = (id, type, data) => API.post(`${base}/${id}/${type}`, data).then((r) => r.data);
export const updateIecItem = (id, type, itemId, data) => API.put(`${base}/${id}/${type}/${itemId}`, data).then((r) => r.data);
export const deleteIecItem = (id, type, itemId) => API.delete(`${base}/${id}/${type}/${itemId}`);
export const uploadIecDocument = (id, form) => API.post(`${base}/${id}/documents`, form, { headers:{"Content-Type":"multipart/form-data"} }).then((r) => r.data);
export const deleteIecDocument = (id, documentId) => API.delete(`${base}/${id}/documents/${documentId}`);
export const submitIecApplication = (id) => API.post(`${base}/${id}/submit`).then((r) => r.data);
export const downloadIecDocument = async (id, uploadedDocument) => {
  const response = await API.get(
    `${base}/${id}/documents/${uploadedDocument.id}`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const link = window.document.createElement("a");
  link.href = url;
  link.download = uploadedDocument.original_name;
  link.click();
  URL.revokeObjectURL(url);
};
