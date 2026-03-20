import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
console.log("[API] Base URL:", BASE_URL);
console.log("[API] VITE_API_URL env:", import.meta.env.VITE_API_URL);
console.log("[API] VITE_SOCKET_URL env:", import.meta.env.VITE_SOCKET_URL);
console.log("[API] MODE:", import.meta.env.MODE);

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  console.log("[API] Request:", config.method?.toUpperCase(), config.url, "| token exists:", !!token);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log("[API] Response:", response.config.method?.toUpperCase(), response.config.url, "| status:", response.status);
    return response;
  },
  (error) => {
    console.error("[API] Error:", error.config?.method?.toUpperCase(), error.config?.url, "| status:", error.response?.status, "| message:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api;
