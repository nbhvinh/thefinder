import axiosClient from './axiosClient';

export function createPost(payload) {
  return axiosClient.post('/posts', payload);
}

export async function getPosts(params = {}) {
  const response = await axiosClient.get('/posts', { params: { size: 12, sort: 'createdAt,desc', ...params } });
  return response.data.content ?? response.data;
}

export async function getPost(postId) {
  const response = await axiosClient.get(`/posts/${postId}`);
  return response.data;
}

export async function getMyPosts() {
  const response = await axiosClient.get('/posts/mine');
  return response.data;
}

export function uploadPostImages(postId, files) {
  const data = new FormData();
  [...files].forEach((file) => data.append('files', file));
  return axiosClient.post(`/posts/${postId}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
}
