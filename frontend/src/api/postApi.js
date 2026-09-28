import api from './axios';

export const getFeedPosts = async () => {
  try {
    const res = await api.get('/posts');
  } catch (err) {
    // If backend is waking up or endpoint not found on older deployment, return empty array gracefully
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get('/api/posts');
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      } catch {
        return [];
      }
    }
    return [];
  }
};

export const getUserPosts = async (userId) => {
  try {
    const res = await api.get(`/posts/user/${userId}`);
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    if (err.response?.status === 404) {
      try {
        const fallbackRes = await api.get(`/api/posts/user/${userId}`);
        return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
      } catch {
        return [];
      }
    }
    return [];
  }
};

export const createPost = async (postData) => {
  try {
    const res = await api.post('/posts', postData);
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallbackRes = await api.post('/api/posts', postData);
      return fallbackRes.data;
    }
    throw err;
  }
};

export const toggleLikePost = async (postId, reaction = 'LIKE') => {
  try {
    const res = await api.post(`/posts/${postId}/like`, { reaction });
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      const fallbackRes = await api.post(`/api/posts/${postId}/like`, { reaction });
      return fallbackRes.data;
    }
    throw err;
  }
};

export const getPostComments = async (postId) => {
  try {
    const res = await api.get(`/posts/${postId}/comments`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
};

export const addPostComment = async (postId, content) => {
  const res = await api.post(`/posts/${postId}/comments`, { content });
  return res.data;
};

export const deletePost = async (postId) => {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
};
