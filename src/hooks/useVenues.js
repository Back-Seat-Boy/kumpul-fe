import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import { listVenues, createVenue, updateVenue, deleteVenue } from "../api/venues";

const DEFAULT_LIMIT = 10;

export const useVenues = (params = {}) => {
  const showError = useToastStore((state) => state.showError);
  
  return useQuery({
    queryKey: ["venues", params],
    queryFn: () => listVenues(params),
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useCreateVenue = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: createVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      showSuccess("Venue created successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useUpdateVenue = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ venueId, data }) => updateVenue(venueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      showSuccess("Venue updated successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useDeleteVenue = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
      showSuccess("Venue deleted successfully");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};
