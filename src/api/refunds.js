import api from "./axios";

export const listEventRefunds = async (eventId) => {
  const res = await api.get(`/api/events/${eventId}/refunds/`);
  return res.data.data;
};

export const listMyRefunds = async () => {
  const res = await api.get("/api/users/me/refunds/");
  return res.data.data;
};

export const updateRefundDestination = async (refundId, data) => {
  const res = await api.patch(`/api/refunds/${refundId}/destination/`, data);
  return res.data.data;
};

export const markRefundSent = async (refundId, data) => {
  const res = await api.patch(`/api/refunds/${refundId}/send/`, data);
  return res.data.data;
};

export const confirmRefundReceipt = async (refundId) => {
  const res = await api.patch(`/api/refunds/${refundId}/confirm-receipt/`);
  return res.data.data;
};
