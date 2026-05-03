import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import {
  getPayment,
  createPayment,
  updatePayment,
  updatePaymentConfig,
  chargeAllPayments,
  claimPayment,
  confirmPayment,
  adjustPayment,
} from "../api/payments";

export const usePayment = (eventId, enabled = true, params = {}) => {
  const showError = useToastStore((state) => state.showError);
  const status = params.status || "";
  
  return useQuery({
    queryKey: ["events", eventId, "payment", { status }],
    queryFn: () => getPayment(eventId, { status: status || undefined }),
    enabled: !!eventId && enabled,
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

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, data }) => updatePayment(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment info updated");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useUpdatePaymentConfig = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, data }) => updatePaymentConfig(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment configuration updated");
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

export const useChargeAllPayments = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, data }) => chargeAllPayments(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Charge applied to all participants");
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
    mutationFn: ({ eventId, participantId, data }) => confirmPayment(eventId, participantId, data),
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
    mutationFn: ({ eventId, participantId, data }) => adjustPayment(eventId, participantId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["events", eventId, "payment"] });
      showSuccess("Payment adjusted");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
