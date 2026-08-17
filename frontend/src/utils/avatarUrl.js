import { resolveBackendUrl } from './apiBaseUrl';

export function resolveAvatarUrl(avatarUrl, username) {
  if (!avatarUrl) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username || 'user')}`;
  }
  return resolveBackendUrl(avatarUrl);
}
