import axiosClient from './axiosClient';

export async function searchUsers(query) {
  const response = await axiosClient.get('/users/search', { params: { query } });
  return response.data;
}

export async function getUserProfile(userId) {
  const response = await axiosClient.get(`/users/${userId}`);
  return response.data;
}

export async function getUserPosts(userId) {
  const response = await axiosClient.get(`/users/${userId}/posts`);
  return response.data;
}

export async function getContactSuggestions() {
  const response = await axiosClient.get('/users/contacts');
  return response.data;
}
