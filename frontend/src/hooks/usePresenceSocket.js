import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch } from 'react-redux';
import { setOnlineUsers, userCameOnline, userWentOffline, setTyping, clearTyping } from '../store/slices/presenceSlice';

// safe url getter - never returns undefined
const getSocketUrl = () => {
  const env = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (env) return env;
  return 'http://localhost:10000'; // your backend fallback
};

export function usePresenceSocket(user) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  useEffect(() => {
    const token = user?.token || user?.accessToken || user?.access_token;
    if (!token) return; // not logged in -> don't connect

    const socketUrl = getSocketUrl();
    if (!socketUrl) return;

    try {
      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('presence:get');
      });

      socket.on('presence:list', (ids) => dispatch(setOnlineUsers(ids)));
      socket.on('presence:online', (p) => dispatch(userCameOnline(p)));
      socket.on('presence:offline', (p) => dispatch(userWentOffline(p)));
      socket.on('chat:typing', ({ conversationId, userId }) => {
        dispatch(setTyping({ conversationId, userId }));
        setTimeout(() => dispatch(clearTyping({ conversationId })), 2000);
      });

      socket.on('connect_error', (err) => {
        console.warn('Socket connect_error', err.message);
      });

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.error('Socket init failed', e);
    }
  }, [user?.token, user?.accessToken, dispatch]);

  return socketRef;
}