import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import {
  listEventRefunds,
  listMyRefunds,
  updateRefundDestination,
  markRefundSent,
  confirmRefundReceipt,
} from "../api/refunds";

export const useEventRefunds = (eventId, enabled = true) => {
  const showError = useToastStore((state) => state.showError);

  return useQuery({
    queryKey: ["events", eventId, "refunds"],
    queryFn: () => listEventRefunds(eventId),
    enabled: !!eventId && enabled,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useMyRefunds = (enabled = true) => {
  const showError = useToastStore((state) => state.showError);

  return useQuery({
    queryKey: ["me", "refunds"],
    queryFn: listMyRefunds,
    enabled,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useUpdateRefundDestination = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ refundId, data }) => updateRefundDestination(refundId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["me", "refunds"] });
      if (data?.event_id) {
        queryClient.invalidateQueries({
          queryKey: ["events", data.event_id, "refunds"],
        });
      }
      showSuccess("Refund destination saved");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useMarkRefundSent = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ refundId, data }) => markRefundSent(refundId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["me", "refunds"] });
      if (data?.event_id) {
        queryClient.invalidateQueries({
          queryKey: ["events", data.event_id, "refunds"],
        });
      }
      showSuccess("Refund marked as sent");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useConfirmRefundReceipt = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ refundId }) => confirmRefundReceipt(refundId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["me", "refunds"] });
      if (data?.event_id) {
        queryClient.invalidateQueries({
          queryKey: ["events", data.event_id, "refunds"],
        });
      }
      showSuccess("Refund receipt confirmed");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
