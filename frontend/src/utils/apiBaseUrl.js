export function getApiBaseUrl() {
  return window.location.hostname === 'localhost' ? 'http://localhost:10000' : '';
}

export function getWsUrl() {
  const base = getApiBaseUrl() || window.location.origin;
  return `${base}/ws`;
}

export function getNativeWsUrl() {
  const base = getApiBaseUrl() || window.location.origin;
  const wsBase = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  return `${wsBase}/ws`;
}

export function resolveBackendUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${getApiBaseUrl()}${url}`;
}
