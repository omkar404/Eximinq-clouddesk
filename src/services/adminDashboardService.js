import API from "./api";

export async function getAdminDashboard() {
  const { data } = await API.get("/auth/admin/dashboard");
  return data;
}
