import { useQuery } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { getMe } from "../api/users";
import { useAuthStore } from "../store/authStore";

export const useAuth = () => {
  const sessionId = useAuthStore((state) => state.sessionId);
  const user = useAuthStore((state) => state.user);
  const showError = useToastStore((state) => state.showError);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!sessionId && !user,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });

  return {
    isAuthenticated: !!sessionId,
    user: userData || user,
    isLoading,
  };
};
