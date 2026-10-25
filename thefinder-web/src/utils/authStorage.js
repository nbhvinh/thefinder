const AUTH_KEYS = ['thefinder-authenticated', 'thefinder-user-name', 'thefinder-user-role'];

export function getAuthValue(key) {
  const persistentValue = localStorage.getItem(key);
  if (persistentValue !== null) return persistentValue;

  const legacyValue = sessionStorage.getItem(key);
  if (legacyValue !== null) {
    localStorage.setItem(key, legacyValue);
    sessionStorage.removeItem(key);
  }
  return legacyValue;
}

export function setAuthValue(key, value) {
  localStorage.setItem(key, value);
  sessionStorage.removeItem(key);
}

export function clearAuthValues() {
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}
