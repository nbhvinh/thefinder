import axiosClient from './axiosClient';

export async function createClaim(postId, request, files) {
  const data = new FormData();
  data.append('request', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  files.forEach((file) => data.append('files', file));
  const response = await axiosClient.post(`/posts/${postId}/claims`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getMyClaims() {
  const response = await axiosClient.get('/claims/mine');
  return response.data;
}

export async function getReceivedClaims() {
  const response = await axiosClient.get('/claims/received');
  return response.data;
}

export async function reviewClaim(claimId) {
  const response = await axiosClient.post(`/claims/${claimId}/review`);
  return response.data;
}

export async function rejectClaim(claimId) {
  const response = await axiosClient.post(`/claims/${claimId}/reject`);
  return response.data;
}

export async function confirmClaim(claimId) {
  const response = await axiosClient.post(`/claims/${claimId}/confirm`);
  return response.data;
}

export function cancelClaim(claimId) {
  return axiosClient.delete(`/claims/${claimId}`);
}
