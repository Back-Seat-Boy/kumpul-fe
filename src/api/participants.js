import api from "./axios";

export const listParticipants = async (shareToken) => {
  const res = await api.get(`/events/${shareToken}/participants/`);
  return res.data.data;
};

export const listParticipantsAuthenticated = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/participants/`);
  return res.data.data;
};

export const joinEvent = async (eventId) => {
  const res = await api.post(`/api/events/${eventId}/participants/`);
  return res.data;
};

export const joinEventByShare = async (shareToken) => {
  try {
    const res = await api.post(`/api/events/share/${shareToken}/participants/`);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      const fallbackRes = await api.post(
        `/api/events/share/${shareToken}/participants`,
      );
      return fallbackRes.data;
    }
    throw error;
  }
};

export const addGuestParticipant = async (eventId, guestName) => {
  const res = await api.post(`/api/events/${eventId}/participants/guest/`, {
    guest_name: guestName,
  });
  return res.data;
};

export const addGuestParticipantByShare = async (shareToken, guestName) => {
  try {
    const res = await api.post(
      `/api/events/share/${shareToken}/participants/guest/`,
      {
        guest_name: guestName,
      },
    );
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 404 || status === 405) {
      const fallbackRes = await api.post(
        `/api/events/share/${shareToken}/participants/guest`,
        {
          guest_name: guestName,
        },
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
