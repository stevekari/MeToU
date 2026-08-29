import { createSlice } from '@reduxjs/toolkit';

const initialMyStatus = localStorage.getItem('gio_user_status') || 'online';

const presenceSlice = createSlice({
  name: 'presence',
  initialState: {
    userStatuses: {}, // { [userId]: 'online' | 'busy' | 'offline' }
    onlineIds: [],
    lastSeen: {},
    myStatus: initialMyStatus,
    typing: {}, // { conversationId: userId }
  },
  reducers: {
    setUserStatus: (state, action) => {
      const { userId, status, lastSeen } = action.payload;
      const normalizedStatus = status || 'online';
      state.userStatuses[String(userId)] = normalizedStatus;

      if (normalizedStatus === 'offline') {
        state.onlineIds = state.onlineIds.filter((i) => String(i) !== String(userId));
        if (lastSeen) state.lastSeen[String(userId)] = lastSeen;
      } else {
        if (!state.onlineIds.some((i) => String(i) === String(userId))) {
          state.onlineIds.push(userId);
        }
      }
    },
    setUserStatuses: (state, action) => {
      const statuses = action.payload || {};
      state.userStatuses = { ...state.userStatuses, ...statuses };
      Object.entries(statuses).forEach(([userId, status]) => {
        if (status === 'offline') {
          state.onlineIds = state.onlineIds.filter((i) => String(i) !== String(userId));
        } else {
          if (!state.onlineIds.some((i) => String(i) === String(userId))) {
            state.onlineIds.push(userId);
          }
        }
      });
    },
    setMyStatus: (state, action) => {
      state.myStatus = action.payload;
      localStorage.setItem('gio_user_status', action.payload);
    },
    setOnlineUsers: (state, action) => {
      state.onlineIds = action.payload || [];
    },
    userCameOnline: (state, action) => {
      const id = action.payload.userId || action.payload;
      if (!state.onlineIds.includes(id)) state.onlineIds.push(id);
      state.userStatuses[String(id)] = 'online';
    },
    userWentOffline: (state, action) => {
      const { userId, lastSeen } = action.payload;
      state.onlineIds = state.onlineIds.filter((i) => String(i) !== String(userId));
      state.userStatuses[String(userId)] = 'offline';
      state.lastSeen[String(userId)] = lastSeen || Date.now();
    },
    setTyping: (state, action) => {
      state.typing[action.payload.conversationId] = action.payload.userId;
    },
    clearTyping: (state, action) => {
      delete state.typing[action.payload.conversationId];
    },
  },
});

export const {
  setUserStatus,
  setUserStatuses,
  setMyStatus,
  setOnlineUsers,
  userCameOnline,
  userWentOffline,
  setTyping,
  clearTyping,
} = presenceSlice.actions;

export default presenceSlice.reducer;