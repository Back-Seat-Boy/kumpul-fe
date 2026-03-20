import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      sessionId: null,
      user: null,
      expiresAt: null,
      
      setSession: (sessionId, user, expiresAt) => set({ sessionId, user, expiresAt }),
      
      clearSession: () => set({ sessionId: null, user: null, expiresAt: null }),
      
      isSessionValid: () => {
        const { sessionId, expiresAt } = get();
        if (!sessionId) return false;
        if (!expiresAt) return true; // No expiry = valid
        
        const expiryDate = new Date(expiresAt);
        const now = new Date();
        return expiryDate > now;
      },
    }),
    { name: "kumpul-auth" }
  )
);
