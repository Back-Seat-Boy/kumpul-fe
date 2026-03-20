import api from "./axios";

export const getVenueWhatsAppLink = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/whatsapp/venue/`);
  return res.data.data;
};

export const getNudgeWhatsAppLink = async (eventId, userId) => {
  const res = await api.get(`/api/events/${eventId}/whatsapp/nudge/${userId}/`);
  return res.data.data;
};
