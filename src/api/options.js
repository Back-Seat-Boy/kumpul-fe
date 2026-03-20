import api from "./axios";

export const listOptions = async (shareToken) => {
  const res = await api.get(`/events/${shareToken}/options/`);
  return res.data.data;
};

export const listOptionsAuthenticated = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/options/`);
  return res.data.data;
};

export const createOption = async (eventId, data) => {
  const res = await api.post(`/api/events/${eventId}/options/`, data);
  return res.data.data;
};

export const deleteOption = async (eventId, optionId) => {
  const res = await api.delete(`/api/events/${eventId}/options/${optionId}/`);
  return res.data;
};
