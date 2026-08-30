const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ORIGIN = configuredApiUrl.replace(/\/$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

export function resolveApiAssetUrl(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}
