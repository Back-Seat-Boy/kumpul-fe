import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { listParticipants, joinEvent, leaveEvent } from "../api/participants";

export const useParticipants = (shareToken) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["event", shareToken, "participants"],
    queryFn: () => listParticipants(shareToken),
    enabled: !!shareToken,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useJoinEvent = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, shareToken }) => joinEvent(eventId),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "participants"] });
      showSuccess("You joined the event");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useLeaveEvent = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, shareToken }) => leaveEvent(eventId),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "participants"] });
      showSuccess("You left the event");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
