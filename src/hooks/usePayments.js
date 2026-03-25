import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { getPayment, createPayment, claimPayment, confirmPayment, adjustPayment } from "../api/payments";

export const usePayment = (eventId) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["events", eventId, "payment"],
    queryFn: () => getPayment(eventId),
    enabled: !!eventId,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, data }) => createPayment(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment collection opened");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useClaimPayment = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, proofImageUrl }) => claimPayment(eventId, proofImageUrl),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment proof submitted");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useConfirmPayment = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, userId }) => confirmPayment(eventId, userId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment confirmed");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useAdjustPayment = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, userId, data }) => adjustPayment(eventId, userId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment adjusted");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
