import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../utils/toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  const sessionId = state.sessionId;
  
  // Check if session is expired before making the request
  if (sessionId && !state.isSessionValid()) {
    // Session expired - clear and redirect
    state.clearSession();
    window.location.href = "/login";
    return Promise.reject(new Error("Session expired"));
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
      useAuthStore.getState().clearSession();
      window.location.href = "/login";
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
