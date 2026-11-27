import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToastStore, getErrorMessage } from "../utils/toast";
import {
  listGroups,
  createGroup,
  renameGroup,
  deleteGroup,
  assignParticipantGroup,
  updateGroupSettings,
  changeOwnGroup,
} from "../api/groups";

const invalidateParticipantGroups = (queryClient, shareToken) => {
  queryClient.invalidateQueries({ queryKey: ["event", shareToken, "groups"] });
  queryClient.invalidateQueries({
    queryKey: ["event", shareToken, "participants"],
  });
  queryClient.invalidateQueries({
    queryKey: ["event", shareToken, "participants-directory"],
  });
};

export const useGroups = (shareToken) => {
  const showError = useToastStore((state) => state.showError);

  return useQuery({
    queryKey: ["event", shareToken, "groups"],
    queryFn: () => listGroups(shareToken),
    enabled: !!shareToken,
    select: (data) => data || [],
    meta: {
      onError: (error) => {
        showError(getErrorMessage(error));
      },
    },
  });
};

export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, name }) => createGroup(eventId, name),
    onSuccess: (_, { shareToken }) => {
      invalidateParticipantGroups(queryClient, shareToken);
      showSuccess("Group created");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useRenameGroup = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, groupId, name }) =>
      renameGroup(eventId, groupId, name),
    onSuccess: (_, { shareToken }) => {
      invalidateParticipantGroups(queryClient, shareToken);
      showSuccess("Group renamed");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, groupId }) => deleteGroup(eventId, groupId),
    onSuccess: (_, { shareToken }) => {
      invalidateParticipantGroups(queryClient, shareToken);
      showSuccess("Group deleted");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useAssignParticipantGroup = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, participantId, groupId }) =>
      assignParticipantGroup(eventId, participantId, groupId),
    onSuccess: (_, { shareToken, groupId }) => {
      invalidateParticipantGroups(queryClient, shareToken);
      showSuccess(groupId ? "Group assigned" : "Participant unassigned");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useUpdateGroupSettings = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, allow }) => updateGroupSettings(eventId, allow),
    onSuccess: (_, { shareToken }) => {
      queryClient.invalidateQueries({ queryKey: ["event", shareToken] });
      queryClient.invalidateQueries({
        queryKey: ["event", shareToken, "groups"],
      });
      showSuccess("Group settings updated");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};

export const useChangeOwnGroup = () => {
  const queryClient = useQueryClient();
  const showError = useToastStore((state) => state.showError);
  const showSuccess = useToastStore((state) => state.showSuccess);

  return useMutation({
    mutationFn: ({ eventId, groupId }) => changeOwnGroup(eventId, groupId),
    onSuccess: (_, { shareToken }) => {
      invalidateParticipantGroups(queryClient, shareToken);
      showSuccess("Group updated");
    },
    onError: (error) => {
      showError(getErrorMessage(error));
    },
  });
};