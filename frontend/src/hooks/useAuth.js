import { useState, useCallback } from 'react';

// Simple localStorage-backed auth hook.
// Stores { token, userId, username, avatarUrl } as JSON under "user".
export function useAuth() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  const loginUser = useCallback((authResponse) => {
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(authResponse));
    setUser(authResponse);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateStoredUser = useCallback((partialUser) => {
    setUser((prev) => {
      const next = { ...prev, ...partialUser };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  }, []);

  return { user, loginUser, logout, updateStoredUser, isAuthenticated: !!user };
}
