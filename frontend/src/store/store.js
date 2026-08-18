import { configureStore } from '@reduxjs/toolkit';
import presenceReducer from './slices/presenceSlice';
import chatReducer from './slices/chatSlice';
import friendsReducer from './slices/friendsSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    presence: presenceReducer,
    chat: chatReducer,
    friends: friendsReducer,
    settings: settingsReducer,
  }
});