import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: false, // Clerk uses Bearer tokens, not cookies
});

// Attach Clerk session token to every request
api.interceptors.request.use(async (config) => {
  try {
    // Dynamically import to avoid circular deps — Clerk's getToken is available globally
    const { Clerk } = window as any;
    if (Clerk?.session) {
      const token = await Clerk.session.getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No session — request goes through without auth header
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

export default api;
