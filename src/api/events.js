import api from "./axios";

export const listEvents = async () => {
  const res = await api.get("/api/events/");
  return res.data.data;
};

export const getEvent = async (shareToken) => {
  const res = await api.get(`/events/${shareToken}/`);
  return res.data.data;
};

export const createEvent = async (data) => {
  const res = await api.post("/api/events/", data);
  return res.data.data;
};

export const updateEventStatus = async (eventId, status) => {
  const res = await api.patch(`/api/events/${eventId}/status/`, { status });
  return res.data;
};

export const setChosenOption = async (eventId, optionId) => {
  const res = await api.patch(`/api/events/${eventId}/chosen-option/`, { option_id: optionId });
  return res.data;
};
