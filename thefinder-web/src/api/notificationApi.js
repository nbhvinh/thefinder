import axiosClient from './axiosClient';

export async function getNotifications(params = {}) {
  const response = await axiosClient.get('/notifications', {
    params: { size: 50, ...params },
  });
  return response.data.content ?? response.data;
}

export function markNotificationRead(notificationId) {
  return axiosClient.patch(`/notifications/${notificationId}/read`);
}
