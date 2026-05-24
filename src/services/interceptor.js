import API from "./api";
import { refreshAccessToken } from "./authService";

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
    if (error.response?.status === 401) {
      try {
        const data = await refreshAccessToken();

        localStorage.setItem("accessToken", data.accessToken);

        error.config.headers.Authorization = `Bearer ${data.accessToken}`;

        return API(error.config);
        
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;