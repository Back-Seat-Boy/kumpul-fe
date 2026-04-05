import { useQuery } from "@tanstack/react-query";
import { getUserById } from "../api/users";
import { useToastStore, getErrorMessage } from "../utils/toast";

export const useUserProfile = (userId) => {
  const showError = useToastStore((state) => state.showError);

  return useQuery({
    queryKey: ["users", userId, "profile"],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

