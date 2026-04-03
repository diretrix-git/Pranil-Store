import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// On 401, redirect to login — with two exceptions:
// 1. The /auth/me probe on app load (silent — just means not logged in)
// 2. Already on /login or /register (would cause a redirect loop)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url ?? "";
      const isAuthProbe = url.includes("/auth/me");
      const isAuthPage = ["/login", "/register"].some((p) =>
        window.location.pathname.startsWith(p),
      );
      if (!isAuthProbe && !isAuthPage) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
