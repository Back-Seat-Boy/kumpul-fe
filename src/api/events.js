import api from "./axios";

// List events with pagination and filters
// params: { page, limit, status, search, visibility, publicOnly }
export const listEvents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.set("page", params.page);
  if (params.limit) queryParams.set("limit", params.limit);
  if (params.status) queryParams.set("status", params.status);
  if (params.search) queryParams.set("search", params.search);
  if (params.visibility) queryParams.set("visibility", params.visibility);
  
  const query = queryParams.toString();
  const basePath = params.publicOnly ? "/events/public/" : "/api/events/";
  const url = query ? `${basePath}?${query}` : basePath;
  
  const res = await api.get(url);
  return res.data.data;
};

export const getEvent = async (shareToken) => {
  const res = await api.get(`/events/${shareToken}/`);
  return res.data.data;
};

// Updated: Now creates event with options in single request
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

export const updateEventSchedule = async (eventId, data) => {
  const res = await api.patch(`/api/events/${eventId}/schedule/`, data);
  return res.data;
};

export const listEventScheduleHistory = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/schedule/history/`);
  return res.data.data;
};
