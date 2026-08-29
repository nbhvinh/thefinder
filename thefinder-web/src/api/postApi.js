import axiosClient from './axiosClient';

export function createPost(payload) {
  return axiosClient.post('/posts', payload);
}

export async function getPosts(params = {}) {
  const response = await axiosClient.get('/posts', { params: { size: 12, sort: 'createdAt,desc', ...params } });
  return response.data.content ?? response.data;
}

export function uploadPostImages(postId, files) {
  const data = new FormData();
  [...files].forEach((file) => data.append('files', file));
  return axiosClient.post(`/posts/${postId}/images`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
}
