import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserById,
  listMyPaymentMethods,
  createMyPaymentMethod,
  updateMyPaymentMethod,
  deleteMyPaymentMethod,
} from "../api/users";
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

export const useMyPaymentMethods = (enabled = true) => {
  const showError = useToastStore((state) => state.showError);

  return useQuery({
    queryKey: ["me", "payment-methods"],
    queryFn: listMyPaymentMethods,
    enabled,
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useCreateMyPaymentMethod = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: createMyPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "payment-methods"] });
      showSuccess("Payment method saved");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useUpdateMyPaymentMethod = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ id, data }) => updateMyPaymentMethod(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "payment-methods"] });
      showSuccess("Payment method updated");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useDeleteMyPaymentMethod = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: deleteMyPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "payment-methods"] });
      showSuccess("Payment method deleted");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
