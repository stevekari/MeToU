import { createSlice } from '@reduxjs/toolkit';

const initialMyStatus = localStorage.getItem('gio_user_status') || 'online';

const presenceSlice = createSlice({
  name: 'presence',
  initialState: {
    userStatuses: {}, // { [userId]: { status: 'online'|'busy'|'offline', online: boolean, lastSeen: timestamp, displayName: string } }
    onlineIds: [],
    lastSeen: {}, // { [userId]: timestamp }
    myStatus: initialMyStatus,
    typing: {}, // { [conversationId]: { userId, username, isTyping: boolean, timestamp: number } }
  },
  reducers: {
    setUserStatus: (state, action) => {
      const payload = action.payload;
      if (!payload || !payload.userId) return;
      const userId = String(payload.userId);
      const isOnline = payload.online !== undefined ? Boolean(payload.online) : payload.status !== 'offline';
      const status = payload.status || (isOnline ? 'online' : 'offline');
      const lastSeen = payload.lastSeen || (isOnline ? null : Date.now());

      state.userStatuses[userId] = {
        status,
        online: isOnline,
        lastSeen: lastSeen || state.userStatuses[userId]?.lastSeen,
        displayName: payload.displayName || state.userStatuses[userId]?.displayName,
        username: payload.username || state.userStatuses[userId]?.username,
      };

      if (isOnline) {
        if (!state.onlineIds.some((i) => String(i) === userId)) {
          state.onlineIds.push(payload.userId);
        }
      } else {
        state.onlineIds = state.onlineIds.filter((i) => String(i) !== userId);
        if (lastSeen) {
          state.lastSeen[userId] = lastSeen;
        }
      }
    },
    setUserStatuses: (state, action) => {
      const statuses = action.payload || {};
      Object.entries(statuses).forEach(([userId, val]) => {
        const idStr = String(userId);
        if (typeof val === 'string') {
          const isOnline = val !== 'offline';
          state.userStatuses[idStr] = {
            status: val,
            online: isOnline,
            lastSeen: state.lastSeen[idStr] || null,
          };
          if (isOnline) {
            if (!state.onlineIds.some((i) => String(i) === idStr)) {
              state.onlineIds.push(userId);
            }
          } else {
            state.onlineIds = state.onlineIds.filter((i) => String(i) !== idStr);
          }
        } else if (val && typeof val === 'object') {
          const isOnline = val.online !== undefined ? Boolean(val.online) : val.status !== 'offline';
          state.userStatuses[idStr] = {
            status: val.status || (isOnline ? 'online' : 'offline'),
            online: isOnline,
            lastSeen: val.lastSeen || state.lastSeen[idStr] || null,
            displayName: val.displayName,
          };
          if (isOnline) {
            if (!state.onlineIds.some((i) => String(i) === idStr)) {
              state.onlineIds.push(userId);
            }
          } else {
            state.onlineIds = state.onlineIds.filter((i) => String(i) !== idStr);
          }
          if (val.lastSeen) {
            state.lastSeen[idStr] = val.lastSeen;
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
      const id = String(action.payload.userId || action.payload);
      if (!state.onlineIds.includes(id)) state.onlineIds.push(id);
      state.userStatuses[id] = {
        ...state.userStatuses[id],
        status: 'online',
        online: true,
      };
    },
    userWentOffline: (state, action) => {
      const userId = String(action.payload.userId || action.payload);
      const lastSeen = action.payload.lastSeen || Date.now();
      state.onlineIds = state.onlineIds.filter((i) => String(i) !== userId);
      state.userStatuses[userId] = {
        ...state.userStatuses[userId],
        status: 'offline',
        online: false,
        lastSeen,
      };
      state.lastSeen[userId] = lastSeen;
    },
    setTyping: (state, action) => {
      const { conversationId, userId, username, isTyping } = action.payload;
      if (isTyping) {
        state.typing[String(conversationId)] = {
          userId,
          username,
          isTyping: true,
          timestamp: Date.now(),
        };
      } else {
        delete state.typing[String(conversationId)];
      }
    },
    clearTyping: (state, action) => {
      delete state.typing[String(action.payload.conversationId)];
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