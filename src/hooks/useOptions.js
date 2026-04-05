import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { useAuthStore } from "../store/authStore";
import { listOptions, listOptionsWithVoters, createOption, deleteOption } from "../api/options";

// Hook for fetching basic options - includes has_voted field for authenticated users
export const useOptions = (shareToken) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["event", shareToken, "options"],
    queryFn: () => listOptions(shareToken),
    enabled: !!shareToken,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

// NEW: Hook for fetching options with voter details
export const useOptionsWithVoters = (eventId, shareToken) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["event", shareToken, "options", "with-voters"],
    queryFn: () => listOptionsWithVoters(shareToken),
    enabled: !!shareToken,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

// Hook to get user's voted option IDs from the has_voted field
export const useVotedOptionIds = (options) => {
  const userId = useAuthStore((state) => state.user?.id);

  if (!options) return [];
  const votedIds = options
    .filter(
      (opt) =>
        opt.has_voted ||
        (userId && Array.isArray(opt.voters) && opt.voters.some((v) => v.user_id === userId)),
    )
    .map((opt) => opt.id);
  return [...new Set(votedIds)];
};

export const useCreateOption = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, data, shareToken }) => createOption(eventId, data),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "options"] });
      showSuccess("Option added successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useDeleteOption = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, optionId, shareToken }) => deleteOption(eventId, optionId),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "options"] });
      showSuccess("Option removed successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
