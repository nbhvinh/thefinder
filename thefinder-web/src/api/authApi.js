import axiosClient from './axiosClient';

export function login({ email, password }) {
  return axiosClient.post('/auth/login', { email, password });
}

export function register(payload) {
  return axiosClient.post('/auth/register', payload);
}

export function logout() {
  return axiosClient.post('/auth/logout');
}

export function getCurrentUser() {
  return axiosClient.get('/auth/me');
}

export function updateAccount(payload) {
  return axiosClient.put('/auth/me', payload);
}
