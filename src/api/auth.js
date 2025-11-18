import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:4000/api", // backend URL
});

// For protected routes later:
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("triage_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const registerUser = (data) => API.post("/auth/register", data);
export const loginUser = (data) => API.post("/auth/login", data);
