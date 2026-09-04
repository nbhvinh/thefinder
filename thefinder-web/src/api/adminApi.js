import axiosClient from './axiosClient';

export async function getPendingReports() {
  const response = await axiosClient.get('/admin/reports', { params: { size: 100 } });
  return response.data.content ?? response.data;
}

export function approveReport(reportId) {
  return axiosClient.post(`/admin/reports/${reportId}/review`);
}

export function dismissReport(reportId) {
  return axiosClient.post(`/admin/reports/${reportId}/dismiss`);
}

export async function searchBlacklistCandidates(query) {
  const response = await axiosClient.get('/admin/users/search', { params: { query, limit: 4 } });
  return response.data;
}

export async function getBlacklistedUsers() {
  const response = await axiosClient.get('/admin/users/blacklisted');
  return response.data;
}

export function blacklistUser(userId) {
  return axiosClient.post(`/admin/users/${userId}/blacklist`);
}

export function removeUserFromBlacklist(userId) {
  return axiosClient.delete(`/admin/users/${userId}/blacklist`);
}
