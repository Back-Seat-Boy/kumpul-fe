import api from "./axios";

export const getPayment = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/payment/`);
  return res.data.data;
};

export const createPayment = async (eventId, data) => {
  const res = await api.post(`/api/events/${eventId}/payment/`, data);
  return res.data.data;
};

export const claimPayment = async (eventId, proofImageUrl = null) => {
  // Only include proof_image_url if it's provided, otherwise send empty object
  const body = proofImageUrl ? { proof_image_url: proofImageUrl } : {};
  const res = await api.post(`/api/events/${eventId}/payment/claim/`, body);
  return res.data;
};

export const confirmPayment = async (eventId, userId) => {
  const res = await api.patch(`/api/events/${eventId}/payment/records/${userId}/`);
  return res.data;
};

export const adjustPayment = async (eventId, userId, data) => {
  const res = await api.post(`/api/events/${eventId}/payment/records/${userId}/adjust/`, data);
  return res.data;
};
