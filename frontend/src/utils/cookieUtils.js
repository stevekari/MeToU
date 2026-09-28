/**
 * Cookie Utilities for GioChat
 * Handles creating, reading, and deleting browser cookies with 1-day default expiration.
 */

export function setCookie(name, value, days = 1) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const encodedValue = encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : String(value));
  document.cookie = `${name}=${encodedValue}; expires=${expires}; path=/; SameSite=Lax`;
}

export function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const c of cookies) {
    const [k, ...v] = c.split('=');
    if (k === name) {
      try {
        const val = decodeURIComponent(v.join('='));
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function hasCookie(name) {
  return getCookie(name) !== null;
}
