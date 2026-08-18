import { createSlice } from '@reduxjs/toolkit';

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    notifications: true,
    showOnline: true,
    readReceipts: true,
  },
  reducers: {
    toggleSetting: (state, action) => {
      const key = action.payload;
      state[key] =!state[key];
    },
    updateSetting: (state, action) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { toggleSetting, updateSetting } = settingsSlice.actions;
export default settingsSlice.reducer;