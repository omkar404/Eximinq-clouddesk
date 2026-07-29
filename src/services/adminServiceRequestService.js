import api from "./api";

export const listAdminServiceRequests = async ({ search = "", status = "" } = {}) => {
  const response = await api.get("/admin/workflow-requests", {
    params: {
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    },
  });
  return response.data;
};

export const getAdminServiceRequest = async (requestId) => {
  const response = await api.get(`/admin/workflow-requests/${requestId}`);
  return response.data;
};

export const updateAdminServiceRequestStatus = async (requestId, status) => {
  const response = await api.patch(`/admin/service-requests/${requestId}/status`, {
    status,
  });
  return response.data;
};

export const downloadAdminServiceRequestDocument = async (requestId, documentId, filename) => {
  const response = await api.get(
    `/admin/service-requests/${requestId}/documents/${documentId}/download`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "supporting-document";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
