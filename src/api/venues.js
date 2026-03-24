import api from "./axios";

// List venues with pagination and search (global - all users can see all venues)
export const listVenues = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.set("page", params.page);
  if (params.limit) queryParams.set("limit", params.limit);
  if (params.search) queryParams.set("search", params.search);
  
  const query = queryParams.toString();
  const url = query ? `/api/venues/?${query}` : "/api/venues/";
  
  const res = await api.get(url);
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
