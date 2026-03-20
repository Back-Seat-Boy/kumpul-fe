import { create } from "zustand";

export const useToastStore = create((set) => ({
  toasts: [],
  
  addToast: (message, type = "error") =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), message, type }],
    })),
    
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
    
  showError: (message) => {
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), message, type: "error" }],
    }));
  },
  
  showSuccess: (message) => {
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now(), message, type: "success" }],
    }));
  },
}));

// Helper to extract error message from API error
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
};
