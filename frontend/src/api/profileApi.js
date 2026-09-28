import api from './axios';

export const getFullProfile = async (userId) => {
  try {
    const res = await api.get(`/profile/${userId}`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get(`/api/profile/${userId}`);
        return fallbackRes.data;
      } catch {
        // Fallback to user API
        const userRes = await api.get(`/users/${userId}/profile`);
        return userRes.data;
      }
    }
    throw err;
  }
};

export const updateFullProfile = async (profileData) => {
  try {
    const res = await api.put('/profile', profileData);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallbackRes = await api.put('/api/profile', profileData);
      return fallbackRes.data;
    }
    throw err;
  }
};

export const trackProfileView = async (userId) => {
  try {
    const res = await api.post(`/profile/${userId}/view`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.post(`/api/profile/${userId}/view`);
        return fallbackRes.data;
      } catch {
        return null;
      }
    }
    return null;
  }
};

export const getProfileAnalytics = async (userId) => {
  try {
    const res = await api.get(`/profile/${userId}/analytics`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get(`/api/profile/${userId}/analytics`);
        return fallbackRes.data;
      } catch {
        return null;
      }
    }
    return null;
  }
};
