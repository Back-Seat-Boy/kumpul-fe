import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { listEvents, getEvent, createEvent, updateEventStatus, setChosenOption } from "../api/events";

const DEFAULT_LIMIT = 10;

// Hook for paginated events list with filters
export const useEvents = (params = {}) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["events", params],
    queryFn: () => listEvents(params),
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useEvent = (shareToken) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["event", shareToken],
    queryFn: () => getEvent(shareToken),
    enabled: !!shareToken,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Event created successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useUpdateEventStatus = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, status }) => updateEventStatus(eventId, status),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Event status updated");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useSetChosenOption = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, optionId }) => setChosenOption(eventId, optionId),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken] });
      queryClient.invalidateQueries({ queryKey: ["event", shareToken, "options"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      showSuccess("Option selected and voting closed");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
