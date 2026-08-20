import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: {}, // { [conversationId]: { lastMessage, lastMessageAt, unread } }
    messagesByConv: {}, // { [conversationId]: [messages] }
    activeId: null,
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload.reduce((items, conversation) => {
        items[conversation.conversationId] = {
          ...conversation,
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageTime,
          unread: state.conversations[conversation.conversationId]?.unread || 0,
        };
        return items;
      }, {});
    },
    setActiveConversation: (state, action) => {
      state.activeId = action.payload;
      if (state.conversations[action.payload]) {
        state.conversations[action.payload].unread = 0;
      }
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messagesByConv[conversationId] = messages;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messagesByConv[conversationId]) state.messagesByConv[conversationId] = [];
      state.messagesByConv[conversationId].push(message);
      state.conversations[conversationId] = {
       ...state.conversations[conversationId],
        lastMessage: message.content,
        lastMessageAt: message.timestamp,
        unread: state.activeId === conversationId? 0 : (state.conversations[conversationId]?.unread || 0) + 1
      };
    },
  },
});

export const { setConversations, setActiveConversation, setMessages, addMessage } = chatSlice.actions;
export default chatSlice.reducer;