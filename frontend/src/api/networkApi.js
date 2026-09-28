import api from './axios';

export const getNetworkSuggestions = async () => {
  const res = await api.get('/network/suggestions');
  return res.data;
};

export const getMyConnections = async () => {
  const res = await api.get('/network/connections');
  return res.data;
};

export const toggleConnectUser = async (targetUserId) => {
  const res = await api.post(`/network/connect/${targetUserId}`);
  return res.data;
};

export const getBusinesses = async () => {
  const res = await api.get('/network/businesses');
  return res.data;
};
