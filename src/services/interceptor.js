import API from "./api";
import { refreshAccessToken } from "./authService";

let refreshPromise = null;

function isAuthenticationEndpoint(url = "") {
  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/forgot-password",
    "/auth/forgot-password/reset"
  ].some((path) => url.includes(path));
}

// attach accessToken to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// auto refresh if token expired
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const shouldRefresh =
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthenticationEndpoint(originalRequest.url) &&
      Boolean(localStorage.getItem("accessToken"));

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        refreshPromise ||= refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
        const data = await refreshPromise;

        localStorage.setItem("accessToken", data.accessToken);

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return API(originalRequest);
      } catch {
        localStorage.clear();
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
