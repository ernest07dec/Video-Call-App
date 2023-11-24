const express = require('express');
const app = express();
const http = require('http').createServer(app);
const PORT =  3002; // Changed port number
const path = require('path');
const cors = require('cors');
const socket = require("socket.io");
const { connected } = require("process");
const io = socket(http, {
    cors: {
        origin: '*',
    }
});
let socketList = {};

app.use(express.static(path.join(__dirname, 'public')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('/*', function (req, res) {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Route
app.get('/ping', (req, res) => {
  res
    .send({
      success: true,
    })
    .status(200);
});

// Socket
io.on('connection', (socket) => {
  console.log(`New User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log('User disconnected!', socket.id);
    delete socketList[socket.id];
  });

  socket.on('BE-check-user', ({ roomId, userName }) => {
    let error = false;
    const roomSockets = io.sockets.adapter.rooms.get(roomId);

    if (roomSockets) {
      const sockets = Array.from(roomSockets);
      sockets.forEach((socketId) => {
        if (socketList[socketId] === userName) {
          error = true;
        }
      });
    }

    socket.emit('FE-error-user-exist', { error });
  });

  socket.on('BE-join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    socketList[socket.id] = { userName, video: true, audio: true };

    const roomSockets = io.sockets.adapter.rooms.get(roomId);

    if (roomSockets) {
      const sockets = Array.from(roomSockets);
      const users = sockets.map((socketId) => ({
        userId: socketId,
        info: socketList[socketId],
      }));
      socket.broadcast.to(roomId).emit('FE-user-join', users);
    }
  });

  socket.on('BE-call-user', ({ userToCall, from, signal }) => {
    io.to(userToCall).emit('FE-receive-call', {
      signal,
      from,
      info: socketList[socket.id],
    });
  });

  socket.on('BE-accept-call', ({ signal, to }) => {
    io.to(to).emit('FE-call-accepted', {
      signal,
      answerId: socket.id,
    });
    console.log("success call")
  });

  socket.on('BE-send-message', ({ roomId, msg, sender }) => {
    io.sockets.in(roomId).emit('FE-receive-message', { msg, sender });
  });

  socket.on('BE-leave-room', ({ roomId, leaver }) => {
    delete socketList[socket.id];
    socket.broadcast
      .to(roomId)
      .emit('FE-user-leave', { userId: socket.id, userName: [socket.id] });
    io.sockets.sockets[socket.id].leave(roomId);
  });

  socket.on('BE-toggle-camera-audio', ({ roomId, switchTarget }) => {
    if (switchTarget === 'video') {
      socketList[socket.id].video = !socketList[socket.id].video;
    } else {
      socketList[socket.id].audio = !socketList[socket.id].audio;
    }
    socket.broadcast
      .to(roomId)
      .emit('FE-toggle-camera', { userId: socket.id, switchTarget });
  });
});

http.listen(PORT, () => {
  console.log('Connected : 3002');
});

