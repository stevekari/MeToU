import { createSlice } from '@reduxjs/toolkit';

const presenceSlice = createSlice({
  name: 'presence',
  initialState: {
    onlineIds: [],
    lastSeen: {},
    typing: {}, // { conversationId: userId }
  },
  reducers: {
    setOnlineUsers: (state, action) => {
      state.onlineIds = action.payload;
    },
    userCameOnline: (state, action) => {
      const id = action.payload.userId || action.payload;
      if (!state.onlineIds.includes(id)) state.onlineIds.push(id);
    },
    userWentOffline: (state, action) => {
      const { userId, lastSeen } = action.payload;
      state.onlineIds = state.onlineIds.filter(i => i!== userId);
      state.lastSeen[userId] = lastSeen || Date.now();
    },
    setTyping: (state, action) => {
      state.typing[action.payload.conversationId] = action.payload.userId;
    },
    clearTyping: (state, action) => {
      delete state.typing[action.payload.conversationId];
    },
  },
});

export const { setOnlineUsers, userCameOnline, userWentOffline, setTyping, clearTyping } = presenceSlice.actions;
export default presenceSlice.reducer;