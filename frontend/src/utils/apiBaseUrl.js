export function getApiBaseUrl() {
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'));

  return isLocal ? 'http://localhost:10000' : 'https://metou-yyau.onrender.com';
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
