import api from './axios';

export const getNetworkSuggestions = async () => {
  try {
    const res = await api.get('/network/suggestions');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get('/api/network/suggestions');
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      } catch {
        return [];
      }
    }
    return [];
  }
};

export const getMyConnections = async () => {
  try {
    const res = await api.get('/network/connections');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get('/api/network/connections');
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      } catch {
        return [];
      }
    }
    return [];
  }
};

export const toggleConnectUser = async (targetUserId) => {
  try {
    const res = await api.post(`/network/connect/${targetUserId}`);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallbackRes = await api.post(`/api/network/connect/${targetUserId}`);
      return fallbackRes.data;
    }
    throw err;
  }
};

export const getBusinesses = async () => {
  try {
    const res = await api.get('/network/businesses');
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get('/api/network/businesses');
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      } catch {
        return [];
      }
    }
    return [];
  }
};

export const getJobs = async (search = '', skill = '') => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (skill) params.append('skill', skill);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const res = await api.get(`/network/jobs${queryString}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get('/api/network/jobs');
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      } catch {
        return [];
      }
    }
    return [];
  }
};
