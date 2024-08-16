const { Server } = require('socket.io')
const User = require('./models/User.js')

exports.setUpSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ['GET', 'POST'],
      credentials: true,
    }
  })

  const userSocketMap = new Map();


  io.on('connection', async (socket) => {
    console.log(`User connected, socket id ${socket.id}`);
    const userId = socket.handshake.auth.token;

    if (!userId) {
      console.log('No user ID provided in handshake');
      return;
    }

    console.log("userid", userId)
    console.log("socket.id", socket.id)
    userSocketMap.set(userId, socket.id);

    await User.findByIdAndUpdate(userId, { $set: { isOnline: true } });
    socket.broadcast.emit('getOnlineStatus', userId);

    socket.on('room:join', (room) => {
      socket.join(room);
      console.log(`User joined room: ${room}`);
    });

    socket.on('new:message', (messageData) => {
      console.log("Message event from:", messageData.sender_id, "to:", messageData.receiver_id);

      const receiverSocketId = userSocketMap.get(messageData.receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive:message', {
          messageReceived: messageData.message,
          sender_id: messageData.sender_id,
          receiver_id: messageData.receiver_id,
          room_id: messageData.room_id,
        });
        console.log(`Message sent to socket ID: ${receiverSocketId}`);
      } else {
        console.log(`User ${messageData.receiver_id} is not connected.`);
      }
    });

    socket.on('videochat:join', ({ from, roomId }) => {
      socket.join(roomId);
      io.to(roomId).emit('videochat:join', { from, roomId });
    });

    socket.on('offer', ({ sdp, room }) => {
      socket.to(room).emit('offer', { sdp });
    });

    socket.on('answer', ({ sdp, room }) => {
      socket.to(room).emit('answer', { sdp });
    });

    socket.on('ice-candidate', ({ candidate, room }) => {
      socket.to(room).emit('ice-candidate', { candidate });
    });

    socket.on('disconnect-call', ({ room }) => {
      socket.to(room).emit('disconnect-call');
    });



    socket.on('disconnect', async () => {
      console.log(`Client disconnected: ${socket.id}`);
      await User.findByIdAndUpdate(userId, { $set: { isOnline: false } });
      socket.broadcast.emit('getOfflineStatus', userId);
      userSocketMap.delete(userId);

    });
  });
}