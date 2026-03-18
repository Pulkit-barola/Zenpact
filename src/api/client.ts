import axios from "axios";
import { auth } from "../firebase";

const BASE_URL = __DEV__ 
  ? "http://127.0.0.1:8000"        // local dev
  : "https://api.zenpath.app";     // your future production URL

const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;