import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userId: null,
  username: '',
  email: '',
  isOnline: true,
  rooms: []
};

const UserSlice = createSlice({
  name: 'User',
  initialState,
  reducers: {
    setUser(state, action) {
      state.userId = action.payload.userId;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.rooms = action.payload.rooms;
    },
    updateOnlineStatus(state, action) {
      state.isOnline = action.payload;
    },
    updateRoomInfo(state, action) {
      const { roomId, chatLatest , SentBy} = action.payload;
      const room = state.rooms.find(room => room.roomId === roomId);
      if (room) {
        room.chatLatest = chatLatest;
        room.SentBy= SentBy
      } else {
        state.rooms.push({ roomId, chatLatest, SentBy });
      }
    },
    initializeRooms(state, action) {
      state.rooms = action.payload.map(roomId => ({
        roomId,
        chatLatest: '',
        SentBy: null,
      }));
    }
  },
});

export const { setUser, updateOnlineStatus, updateRoomInfo, initializeRooms } = UserSlice.actions;
export default UserSlice.reducer;
