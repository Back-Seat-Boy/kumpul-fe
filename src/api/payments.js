import api from "./axios";

export const getPayment = async (eventId, params = {}) => {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.set("status", params.status);

  const query = queryParams.toString();
  const url = query
    ? `/api/events/${eventId}/payment/?${query}`
    : `/api/events/${eventId}/payment/`;
  const res = await api.get(url);
  return res.data.data;
};

export const createPayment = async (eventId, data) => {
  const res = await api.post(`/api/events/${eventId}/payment/`, data);
  return res.data.data;
};

export const updatePayment = async (eventId, data) => {
  const res = await api.patch(`/api/events/${eventId}/payment/`, data);
  return res.data.data;
};

export const updatePaymentConfig = async (eventId, data) => {
  const res = await api.patch(`/api/events/${eventId}/payment/config/`, data);
  return res.data.data;
};

export const chargeAllPayments = async (eventId, data) => {
  const res = await api.post(`/api/events/${eventId}/payment/charge-all/`, data);
  return res.data;
};

export const claimPayment = async (eventId, proofImageUrl = null) => {
  // Only include proof_image_url if it's provided, otherwise send empty object
  const body = proofImageUrl ? { proof_image_url: proofImageUrl } : {};
  const res = await api.post(`/api/events/${eventId}/payment/claim/`, body);
  return res.data;
};

export const confirmPayment = async (eventId, participantId, data = {}) => {
  const res = await api.patch(`/api/events/${eventId}/payment/records/${participantId}/`, data);
  return res.data;
};

export const adjustPayment = async (eventId, participantId, data) => {
  const res = await api.post(`/api/events/${eventId}/payment/records/${participantId}/adjust/`, data);
  return res.data;
};
