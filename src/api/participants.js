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

export const leaveEvent = async (eventId) => {
  const res = await api.delete(`/api/events/${eventId}/participants/`);
  return res.data;
};
