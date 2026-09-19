export function formatTimeAgo(dateInput) {
  if (!dateInput) return null;
  const date = typeof dateInput === 'string' || typeof dateInput === 'number'
    ? new Date(dateInput)
    : dateInput;

  if (isNaN(date.getTime())) return null;

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `yesterday at ${timeStr}`;
  }

  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatLastSeenText(isOnline, lastSeenDate, customStatus) {
  if (isOnline) {
    if (customStatus === 'busy') return 'Busy (Do Not Disturb)';
    return 'Online';
  }
  const timeAgo = formatTimeAgo(lastSeenDate);
  if (!timeAgo) return 'Offline';
  return `Last seen ${timeAgo}`;
}

export function formatJoinedDate(dateInput) {
  if (!dateInput) return 'Joined recently';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Joined recently';
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  return `Joined ${monthName} ${year}`;
}

