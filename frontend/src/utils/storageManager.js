import { setCookie, getCookie, deleteCookie } from './cookieUtils';

const TIMESTAMPS_KEY = 'gio_storage_timestamps';
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Prunes any localStorage keys that are older than 1 day (24 hours).
 */
export function cleanupExpiredLocalStorage(maxAgeMs = ONE_DAY_MS) {
  try {
    const now = Date.now();
    let timestamps = {};

    try {
      timestamps = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
    } catch {
      timestamps = {};
    }

    const updatedTimestamps = {};
    const keysToRemove = [];

    // Check all recorded timestamps
    Object.keys(timestamps).forEach((key) => {
      const storedTime = timestamps[key];
      if (now - storedTime > maxAgeMs) {
        keysToRemove.push(key);
      } else {
        updatedTimestamps[key] = storedTime;
      }
    });

    // Remove expired keys
    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
      deleteCookie(key);
    });

    // Also scan any untracked keys created in the past without timestamp metadata
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== TIMESTAMPS_KEY && !timestamps[key]) {
        // Track new creation time for untracked keys
        updatedTimestamps[key] = now;
      }
    }

    localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(updatedTimestamps));
  } catch (err) {
    console.warn('Storage cleanup notice:', err);
  }
}

/**
 * Saves a key-value pair to localStorage with 1-day timestamp and mirrors to a 1-day cookie.
 */
export function setStorageItem(key, value, days = 1) {
  try {
    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    localStorage.setItem(key, stringVal);

    // Save timestamp metadata
    let timestamps = {};
    try {
      timestamps = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
    } catch {
      timestamps = {};
    }
    timestamps[key] = Date.now();
    localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(timestamps));

    // Mirror to cookie with 1-day expiration
    setCookie(key, value, days);
  } catch (err) {
    console.warn('Failed to set storage item:', err);
  }
}

/**
 * Retrieves a key from localStorage (or fallback cookie) if not expired.
 */
export function getStorageItem(key) {
  try {
    // Check if expired
    let timestamps = {};
    try {
      timestamps = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
    } catch {
      timestamps = {};
    }

    if (timestamps[key]) {
      const isExpired = Date.now() - timestamps[key] > ONE_DAY_MS;
      if (isExpired) {
        localStorage.removeItem(key);
        deleteCookie(key);
        delete timestamps[key];
        localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(timestamps));
        return null;
      }
    }

    const val = localStorage.getItem(key);
    if (val !== null) {
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    }

    // Fallback to cookie
    return getCookie(key);
  } catch {
    return null;
  }
}

/**
 * Removes a key from both localStorage and cookies.
 */
export function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
    deleteCookie(key);

    let timestamps = {};
    try {
      timestamps = JSON.parse(localStorage.getItem(TIMESTAMPS_KEY) || '{}');
    } catch {
      timestamps = {};
    }
    delete timestamps[key];
    localStorage.setItem(TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch (err) {
    console.warn('Failed to remove storage item:', err);
  }
}
