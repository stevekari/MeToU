import api from './axios';

export const getFeedPosts = async () => {
  const res = await api.get('/posts');
  return res.data;
};

export const getUserPosts = async (userId) => {
  const res = await api.get(`/posts/user/${userId}`);
  return res.data;
};

export const createPost = async (postData) => {
  const res = await api.post('/posts', postData);
  return res.data;
};

export const toggleLikePost = async (postId, reaction = 'LIKE') => {
  const res = await api.post(`/posts/${postId}/like`, { reaction });
  return res.data;
};

export const getPostComments = async (postId) => {
  const res = await api.get(`/posts/${postId}/comments`);
  return res.data;
};

export const addPostComment = async (postId, content) => {
  const res = await api.post(`/posts/${postId}/comments`, { content });
  return res.data;
};

export const deletePost = async (postId) => {
  const res = await api.delete(`/posts/${postId}`);
  return res.data;
};
