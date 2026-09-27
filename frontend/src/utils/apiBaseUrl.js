export function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';

  // 1. Explicit environment variable override
  if (import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const origin = window.location.origin;

  // 2. Local development: if on localhost/127.0.0.1 and not port 10000, route to Spring Boot backend on 10000
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    if (window.location.port === '10000') {
      return origin;
    }
    return 'http://localhost:10000';
  }

  // 3. Mobile hybrid app (Capacitor / Cordova)
  if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) {
    return 'https://giochat-nd1e.onrender.com';
  }

  // 4. Production Web / PWA: Use the same origin that served the app
  return origin;
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
