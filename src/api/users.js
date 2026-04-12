import api from "./axios";

export const getMe = async () => {
  const res = await api.get("/api/users/me/");
  return res.data.data;
};

export const getUserById = async (userId) => {
  const res = await api.get(`/api/users/${userId}/`);
  return res.data.data;
};

export const updateMe = async (data) => {
  const res = await api.patch("/api/users/me/", data);
  return res.data.data;
};

export const listUserCreatedEvents = async (userId) => {
  const res = await api.get(`/api/users/${userId}/events/created/`);
  return res.data.data;
};

export const listUserParticipatedEvents = async (userId) => {
  const res = await api.get(`/api/users/${userId}/events/participated/`);
  return res.data.data;
};

export const listMyPaymentMethods = async () => {
  const res = await api.get("/api/users/me/payment-methods/");
  return res.data.data;
};

export const createMyPaymentMethod = async (data) => {
  const res = await api.post("/api/users/me/payment-methods/", data);
  return res.data.data;
};

export const updateMyPaymentMethod = async (id, data) => {
  const res = await api.patch(`/api/users/me/payment-methods/${id}/`, data);
  return res.data.data;
};

export const deleteMyPaymentMethod = async (id) => {
  const res = await api.delete(`/api/users/me/payment-methods/${id}/`);
  return res.data;
};
