import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../utils/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

const isProtectedPath = (pathname = "") => {
  return (
    pathname.startsWith("/events/new") ||
    pathname.startsWith("/users/") ||
    pathname.startsWith("/settings/")
  );
};

const redirectIfProtected = () => {
  const pathname = window.location.pathname || "";
  if (isProtectedPath(pathname)) {
    window.location.href = "/login";
  }
};

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  const sessionId = state.sessionId;
  
  // Check if session is expired before making the request
  if (sessionId && !state.isSessionValid()) {
    // Session expired - clear session. Only redirect if user is on a protected page.
    state.clearSession();
    redirectIfProtected();
    return config;
  }
  
  if (sessionId) {
    config.headers.Authorization = `Bearer ${sessionId}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Extract error message
    const message = error.response?.data?.message || error.message || "An error occurred";
    
    // Handle 401 - Unauthorized
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      const hadAuthHeader = Boolean(
        originalRequest?.headers?.Authorization ||
          originalRequest?.headers?.authorization,
      );

      useAuthStore.getState().clearSession();

      // On public pages, retry once without Authorization so guest access still works.
      if (
        hadAuthHeader &&
        originalRequest &&
        !originalRequest._retry &&
        !isProtectedPath(window.location.pathname || "")
      ) {
        originalRequest._retry = true;
        if (originalRequest.headers) {
          delete originalRequest.headers.Authorization;
          delete originalRequest.headers.authorization;
        }
        return api(originalRequest);
      }

      redirectIfProtected();
      return Promise.reject(error);
    }
    
    // Handle 403 - Forbidden
    if (error.response?.status === 403) {
      useToastStore.getState().showError("You don't have permission to do this");
      return Promise.reject(error);
    }
    
    // For other errors, the component will handle showing the toast
    // We just need to make sure the error is properly formatted
    error.userMessage = message;
    
    return Promise.reject(error);
  }
);

export default api;
