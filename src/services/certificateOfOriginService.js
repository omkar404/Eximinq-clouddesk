import API from "./api";

const basePath = "/service-store/certificate-of-origin";

export async function getCertificateOfOriginConfiguration() {
  const response = await API.get(basePath);
  return response.data;
}

export async function getCertificateOfOriginQuote(certificateType) {
  const response = await API.post(`${basePath}/quote`, { certificateType });
  return response.data;
}

export async function saveCertificateOfOriginDraft(payload) {
  const response = await API.post(`${basePath}/drafts`, payload);
  return response.data;
}

export async function submitCertificateOfOrigin(payload) {
  const response = await API.post(`${basePath}/submit`, payload);
  return response.data;
}

export async function getCertificateOfOriginRequests() {
  const response = await API.get(`${basePath}/requests`);
  return response.data;
}

export async function getCertificateOfOriginLedger() {
  const response = await API.get(`${basePath}/ledger`);
  return response.data;
}

export async function uploadCertificateOfOriginDocument(requestId, documentKey, file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await API.post(
    `${basePath}/drafts/${requestId}/documents/${documentKey}`,
    formData
  );
  return response.data;
}

export async function removeCertificateOfOriginDocument(requestId, documentKey) {
  await API.delete(`${basePath}/drafts/${requestId}/documents/${documentKey}`);
}
