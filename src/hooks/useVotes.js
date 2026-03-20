import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { castVote, removeVote } from "../api/votes";

export const useCastVote = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, eventOptionId, shareToken }) =>
      castVote(eventId, eventOptionId),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "options"] });
      showSuccess("Vote recorded");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useRemoveVote = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, optionId, shareToken }) => removeVote(eventId, optionId),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "options"] });
      showSuccess("Vote removed");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
