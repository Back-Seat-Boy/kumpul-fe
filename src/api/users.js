import api from "./axios";

export const getMe = async () => {
  const res = await api.get("/api/users/me/");
  return res.data.data;
};

export const updateMe = async (data) => {
  const res = await api.patch("/api/users/me/", data);
  return res.data.data;
};
