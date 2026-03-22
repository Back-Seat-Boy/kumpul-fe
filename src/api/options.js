import api from "./axios";

// Public endpoint - returns options with vote counts
// For authenticated requests, includes has_voted field
export const listOptions = async (shareToken) => {
  const res = await api.get(`/events/${shareToken}/options/`);
  return res.data.data;
};

// Authenticated endpoint - returns options with has_voted for current user
export const listOptionsAuthenticated = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/options/`);
  return res.data.data;
};

// NEW: Get options with voter details (for displaying who voted)
export const listOptionsWithVoters = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/options/with-voters/`);
  return res.data.data;
};

// Note: Creating individual options is still supported but
// typically options are created with the event in a single request
export const createOption = async (eventId, data) => {
  const res = await api.post(`/api/events/${eventId}/options/`, data);
  return res.data.data;
};

export const deleteOption = async (eventId, optionId) => {
  const res = await api.delete(`/api/events/${eventId}/options/${optionId}/`);
  return res.data;
};
