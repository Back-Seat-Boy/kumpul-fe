import api from "./axios";

export const listGroups = async (shareToken) => {
  const res = await api.get(`/events/${shareToken}/groups/`);
  return res.data.data;
};

export const createGroup = async (eventId, name) => {
  const res = await api.post(`/api/events/${eventId}/groups/`, { name });
  return res.data.data;
};

export const renameGroup = async (eventId, groupId, name) => {
  const res = await api.patch(`/api/events/${eventId}/groups/${groupId}/`, {
    name,
  });
  return res.data.data;
};

export const deleteGroup = async (eventId, groupId) => {
  const res = await api.delete(`/api/events/${eventId}/groups/${groupId}/`);
  return res.data;
};

export const assignParticipantGroup = async (
  eventId,
  participantId,
  groupId,
) => {
  const res = await api.patch(
    `/api/events/${eventId}/participants/${participantId}/group/`,
    { group_id: groupId },
  );
  return res.data.data;
};

export const updateGroupSettings = async (eventId, allowGroupSelfSelect) => {
  const res = await api.patch(
    `/api/events/${eventId}/group-settings/`,
    { allow_group_self_select: allowGroupSelfSelect },
  );
  return res.data.data;
};

export const changeOwnGroup = async (eventId, groupId) => {
  const res = await api.patch(
    `/api/events/${eventId}/participants/me/group/`,
    { group_id: groupId },
  );
  return res.data.data;
};