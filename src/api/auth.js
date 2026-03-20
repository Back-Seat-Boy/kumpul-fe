import api from "./axios";

export const getGoogleLoginUrl = async () => {
  const res = await api.get("/auth/google/login/");
  return res.data.data;
};

export const logout = async () => {
  const res = await api.post("/api/auth/logout/");
  return res.data;
};
