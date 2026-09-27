export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  // 1. Explicit environment variable override
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const origin = window.location.origin;

}

export function getWsUrl() {
  const base = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/ws`;
}

export function getNativeWsUrl() {
  const base = getApiBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
  const wsBase = base.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:');
  return `${wsBase}/ws`;
}

export function resolveBackendUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${getApiBaseUrl()}${url}`;
}
