import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  selectedChat: null,
};

const selectedChatSlice = createSlice({
  name: 'selectedChat',
  initialState,
  reducers: {
    setselectedChat(state, action) {
        console.log("from redux",action.payload)
      state.selectedChat = action.payload;
    },
  },
});

export const { setselectedChat } = selectedChatSlice.actions;
export default selectedChatSlice.reducer;
