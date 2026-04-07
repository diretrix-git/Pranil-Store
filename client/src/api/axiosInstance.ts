import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: false,
});

// Always attach the latest Clerk token before every request
api.interceptors.request.use(async (config) => {
  try {
    // window.__clerk_frontend_api is set by ClerkProvider
    // Clerk exposes the active session on window.Clerk after initialization
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) {
        config.headers.set("Authorization", `Bearer ${token}`);
      }
    }
  } catch {
    // No active session — request goes without auth header
  }
  return config;
});

export default api;
