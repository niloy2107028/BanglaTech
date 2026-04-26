import axios, { InternalAxiosRequestConfig } from "axios";

import { getToken } from "./tokenStorage";

const baseURL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  "http://10.0.2.2:5000";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  config.headers["x-client-type"] = "mobile";
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
