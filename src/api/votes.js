import api from "./axios";

export const castVote = async (eventId, eventOptionId) => {
  const res = await api.post(`/api/events/${eventId}/votes/`, { event_option_id: eventOptionId });
  return res.data;
};

export const removeVote = async (eventId, optionId) => {
  const res = await api.delete(`/api/events/${eventId}/votes/${optionId}/`);
  return res.data;
};
