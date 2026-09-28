import api from './axios';

export const getFullProfile = async (userId) => {
  const res = await api.get(`/profile/${userId}`);
  return res.data;
};

export const updateFullProfile = async (profileData) => {
  const res = await api.put('/profile', profileData);
  return res.data;
};

export const trackProfileView = async (userId) => {
  const res = await api.post(`/profile/${userId}/view`);
  return res.data;
};

export const getProfileAnalytics = async (userId) => {
  const res = await api.get(`/profile/${userId}/analytics`);
  return res.data;
};
