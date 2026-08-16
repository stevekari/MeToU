const API_BASE_URL = 'http://localhost:8080';

function resolveBackendUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  return `${API_BASE_URL}${url}`;
}

export function resolveAvatarUrl(avatarUrl, username) {
  if (!avatarUrl) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'user')}`;
  }
  return resolveBackendUrl(avatarUrl);
}
