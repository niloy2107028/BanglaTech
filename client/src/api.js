import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "" : window.location.origin);

axios.defaults.baseURL = apiBaseUrl;
axios.defaults.withCredentials = true;

export const apiOrigin = apiBaseUrl || window.location.origin;
export const clientOrigin =
  import.meta.env.VITE_CLIENT_URL || window.location.origin;
export const googleAuthUrl = `${apiOrigin}/api/auth/google`;

export default axios;
