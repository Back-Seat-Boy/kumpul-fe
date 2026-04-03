import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import {
  listParticipants,
  joinEvent,
  addGuestParticipant,
  leaveEvent,
  getRemovalImpact,
  removeParticipant,
} from "../api/participants";

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
    onSuccess: (_, { eventId, shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
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
    onSuccess: (_, { eventId, shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("You left the event");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useAddGuestParticipant = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, guestName }) => addGuestParticipant(eventId, guestName),
    onSuccess: (_, { eventId, shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Guest added");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, participantId }) => removeParticipant(eventId, participantId),
    onSuccess: (data, { eventId, shareToken, onImpact }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      
      // Call the onImpact callback with the impacts data if provided
      if (onImpact && data.impacts) {
        onImpact(data);
      } else {
        // Fallback to simple toast
        showSuccess(data.message || "Participant removed");
      }
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useRemovalImpact = () => {
  const showError = useToastStore((state) => state.showError);

  return useMutation({
    mutationFn: ({ eventId, participantId }) => getRemovalImpact(eventId, participantId),
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
