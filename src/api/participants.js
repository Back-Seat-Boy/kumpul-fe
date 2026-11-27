import api from "./axios";

export const listParticipants = async (shareToken, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page);
  if (params.limit) queryParams.set("limit", params.limit);
  if (params.mode) queryParams.set("mode", params.mode);
  if (params.cursor) queryParams.set("cursor", params.cursor);
  if (params.search) queryParams.set("search", params.search);
  if (params.sort_order) queryParams.set("sort_order", params.sort_order);
  if (params.group_id) queryParams.set("group_id", params.group_id);
  const query = queryParams.toString();
  const res = await api.get(
    query ? `/events/${shareToken}/participants/?${query}` : `/events/${shareToken}/participants/`,
  );
  return res.data.data;
};

export const listParticipantsAuthenticated = async (eventId, params = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", params.page);
  if (params.limit) queryParams.set("limit", params.limit);
  if (params.mode) queryParams.set("mode", params.mode);
  if (params.cursor) queryParams.set("cursor", params.cursor);
  if (params.search) queryParams.set("search", params.search);
  if (params.sort_order) queryParams.set("sort_order", params.sort_order);
  if (params.group_id) queryParams.set("group_id", params.group_id);
  const query = queryParams.toString();
  const res = await api.get(
    query ? `/api/events/${eventId}/participants/?${query}` : `/api/events/${eventId}/participants/`,
  );
  return res.data.data;
};

const getJoinBody = (groupId) => (groupId ? { group_id: groupId } : undefined);

export const joinEvent = async (eventId, groupId) => {
  const res = await api.post(
    `/api/events/${eventId}/participants/`,
    getJoinBody(groupId),
  );
  return res.data;
};

export const joinEventByShare = async (shareToken, groupId) => {
  const body = getJoinBody(groupId);
  try {
    const res = await api.post(
      `/api/events/share/${shareToken}/participants/`,
      body,
    );
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      const fallbackRes = await api.post(
        `/api/events/share/${shareToken}/participants`,
        body,
      );
      return fallbackRes.data;
    }
    throw error;
  }
};

const getGuestBody = (guestName, groupId) => {
  const body = { guest_name: guestName };
  if (groupId) body.group_id = groupId;
  return body;
};

export const addGuestParticipant = async (eventId, guestName, groupId) => {
  const res = await api.post(
    `/api/events/${eventId}/participants/guest/`,
    getGuestBody(guestName, groupId),
  );
  return res.data;
};

export const addGuestParticipantByShare = async (
  shareToken,
  guestName,
  groupId,
) => {
  const body = getGuestBody(guestName, groupId);
  try {
    const res = await api.post(
      `/api/events/share/${shareToken}/participants/guest/`,
      body,
    );
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      const fallbackRes = await api.post(
        `/api/events/share/${shareToken}/participants/guest`,
        body,
      );
      return fallbackRes.data;
    }
    throw error;
  }
};

export const leaveEvent = async (eventId) => {
  const res = await api.delete(`/api/events/${eventId}/participants/`);
  return res.data;
};

export const getRemovalImpact = async (eventId, participantId) => {
  const res = await api.get(
    `/api/events/${eventId}/participants/${participantId}/removal-impact/`,
  );
  return res.data.data;
};

export const removeParticipant = async (eventId, participantId) => {
  const res = await api.delete(`/api/events/${eventId}/participants/${participantId}/`);
  return res.data.data;
};
