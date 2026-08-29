import axiosClient from './axiosClient';

export async function getCategories() {
  const response = await axiosClient.get('/categories');
  return response.data;
}
