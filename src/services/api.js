import axios from "axios";

const defaultApiUrl = `${window.location.protocol}//${window.location.hostname}:4001`;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true
});

API.interceptors.response.use((response) => {
  const method = response.config?.method?.toUpperCase();
  if (typeof window !== "undefined" && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    window.dispatchEvent(new CustomEvent("clouddesk:operations-updated", {
      detail: { url: response.config?.url, method, occurredAt: Date.now() }
    }));
  }
  return response;
});

export default API;
