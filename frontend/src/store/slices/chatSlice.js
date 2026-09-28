import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: {}, // { [conversationId]: { lastMessage, lastMessageAt, unread, otherUser } }
    messagesByConv: {}, // { [conversationId]: [messages] }
    activeId: null,
  },
  reducers: {
    setConversations: (state, action) => {
      const list = Array.isArray(action.payload) ? action.payload : [];
      state.conversations = list.reduce((items, conversation) => {
        const id = String(conversation.conversationId);
        const isActive = String(state.activeId) === id;
        items[id] = {
          ...conversation,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageTime,
          unread: isActive ? 0 : (state.conversations[id]?.unread || 0),
        };
        return items;
      }, {});
    },
    setActiveConversation: (state, action) => {
      const id = action.payload ? String(action.payload) : null;
      state.activeId = id;
      if (id && state.conversations[id]) {
        state.conversations[id].unread = 0;
      }
    },
    markAsRead: (state, action) => {
      const id = action.payload ? String(action.payload) : null;
      if (id && state.conversations[id]) {
        state.conversations[id].unread = 0;
      }
      if (id && state.messagesByConv[id]) {
        state.messagesByConv[id].forEach((msg) => {
          msg.status = 'READ';
        });
      }
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messagesByConv[String(conversationId)] = messages || [];
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      const id = String(conversationId);
      if (!state.messagesByConv[id]) state.messagesByConv[id] = [];

      const existingIndex = state.messagesByConv[id].findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        state.messagesByConv[id][existingIndex] = {
          ...state.messagesByConv[id][existingIndex],
          ...message,
        };
      } else {
        state.messagesByConv[id].push(message);
      }

      const isActive = String(state.activeId) === id;
      state.conversations[id] = {
        ...state.conversations[id],
        lastMessage: message.isDeleted ? 'This message was deleted' : message.content,
        lastMessageAt: message.timestamp || new Date().toISOString(),
        unread: isActive ? 0 : ((state.conversations[id]?.unread || 0) + 1),
      };
    },
    updateMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      const id = String(conversationId);
      if (state.messagesByConv[id]) {
        const index = state.messagesByConv[id].findIndex((m) => m.id === message.id);
        if (index >= 0) {
          state.messagesByConv[id][index] = {
            ...state.messagesByConv[id][index],
            ...message,
          };
        }
      }
    },
    markMessagesAsReadInConv: (state, action) => {
      const { conversationId, readerId } = action.payload;
      const id = String(conversationId);
      if (state.messagesByConv[id]) {
        state.messagesByConv[id].forEach((msg) => {
          if (String(msg.senderId) !== String(readerId)) {
            msg.status = 'READ';
          }
        });
      }
    },
  },
});

export const {
  setConversations,
  setActiveConversation,
  markAsRead,
  setMessages,
  addMessage,
  updateMessage,
  markMessagesAsReadInConv,
} = chatSlice.actions;

export default chatSlice.reducer;