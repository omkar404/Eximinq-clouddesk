import API from "./api";

export const registerUser = async (data) => {
  const res = await API.post("/auth/register", data); 
  return res.data;
};

export const loginUser = async (data) => {
  const res = await API.post("/auth/login", data);
  return res.data;
};

export const getDashboardSession = async () => {
  const res = await API.get("/auth/dashboard");
  return res.data;
};

export const refreshAccessToken = async () => {
  const res = await API.post("/auth/refresh");
  return res.data;
};

export const logoutUser = async () => {
  await API.post("/auth/logout");
};

export const resetPassword = async (data) => {
  const res = await API.post("/auth/reset-password", data);
  return res.data;
};

export const forgotPassword = async (data) => {
  const res = await API.post("/auth/forgot-password", data);
  return res.data;
};

export const resetForgottenPassword = async (data) => {
  const res = await API.post("/auth/forgot-password/reset", data);
  return res.data;
};

export const getCompanyProfile = async () => {
  const res = await API.get("/auth/company-profile");
  return res.data;
};

export const updateCompanyProfile = async (data) => {
  const res = await API.put("/auth/company-profile", data);
  return res.data;
};
