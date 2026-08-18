import { createSlice } from '@reduxjs/toolkit';

const friendsSlice = createSlice({
  name: 'friends',
  initialState: {
    list: [],
    searchResults: [],
    loading: false,
  },
  reducers: {
    setFriends: (state, action) => {
      state.list = action.payload;
    },
    setSearchResults: (state, action) => {
      state.searchResults = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setFriends, setSearchResults, setLoading } = friendsSlice.actions;
export default friendsSlice.reducer;