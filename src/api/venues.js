import api from "./axios";

export const listVenues = async () => {
  const res = await api.get("/api/venues/");
  return res.data.data;
};

export const createVenue = async (data) => {
  const res = await api.post("/api/venues/", data);
  return res.data.data;
};

export const updateVenue = async (venueId, data) => {
  const res = await api.patch(`/api/venues/${venueId}/`, data);
  return res.data.data;
};

export const deleteVenue = async (venueId) => {
  const res = await api.delete(`/api/venues/${venueId}/`);
  return res.data;
};
