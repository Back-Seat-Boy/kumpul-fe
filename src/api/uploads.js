import api from "./axios";

export const uploadImage = async (base64Image) => {
  const res = await api.post("/api/uploads/image/", { image_base64: base64Image });
  return res.data.data;
};
