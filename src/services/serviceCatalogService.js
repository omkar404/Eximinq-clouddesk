import API from "./api";

export async function getServiceStoreCatalog() {
  const response = await API.get("/service-store/catalog");
  return response.data;
}
