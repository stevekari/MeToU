export function getApiBaseUrl() {
  return window.location.hostname === 'localhost' ? 'http://localhost:8080' : '';
}

export function getWsUrl() {
  const base = getApiBaseUrl() || window.location.origin;
  return `${base}/ws`;
}

export function resolveBackendUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${getApiBaseUrl()}${url}`;
}
