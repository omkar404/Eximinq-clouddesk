import API from "./interceptor";

function parseFilenameFromDisposition(disposition) {
  if (!disposition) {
    return null;
  }

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const plainMatch = disposition.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] || null;
}

function triggerBrowserDownload(blob, filename) {
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

function openBlobInNewTab(blob) {
  const objectUrl = window.URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
}

export async function uploadCompanyDocument(documentType, file, fieldKey) {
  const formData = new FormData();
  formData.append("file", file);
  if (fieldKey) {
    formData.append("fieldKey", fieldKey);
  }

  const response = await API.post(
    `/auth/company-profile/documents/${documentType}`,
    formData
  );

  return response.data;
}

export async function removeTempCompanyDocument(documentType, token) {
  const response = await API.delete(
    `/auth/company-profile/documents/${documentType}/temp/${token}`
  );

  return response.data;
}

export async function uploadBookingDocument({ bookingId, documentType, file }) {
  const formData = new FormData();
  formData.append("booking_id", bookingId);
  formData.append("document_type", documentType);
  formData.append("file", file);

  const response = await API.post("/auth/documents/upload", formData);
  return response.data;
}

export async function fetchAdminClients() {
  const response = await API.get("/auth/admin/clients");
  return response.data?.clients || [];
}

export async function approveAdminCompanyProfile(clientId) {
  const response = await API.post(`/auth/admin/clients/${clientId}/company-profile/approve`);
  return response.data;
}

export async function openClientCompanyProfileDocument(url) {
  const response = await API.get(url, { responseType: "blob" });
  openBlobInNewTab(response.data);
}

export async function downloadAdminFile(url, fallbackName) {
  const response = await API.get(url, { responseType: "blob" });
  const filename =
    parseFilenameFromDisposition(response.headers["content-disposition"]) ||
    fallbackName ||
    "download";

  triggerBrowserDownload(response.data, filename);
}
