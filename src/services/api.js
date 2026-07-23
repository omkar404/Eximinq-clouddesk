import axios from "axios";

const defaultApiUrl = `${window.location.protocol}//${window.location.hostname}:4001`;

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
  withCredentials: true
});

export default API;
