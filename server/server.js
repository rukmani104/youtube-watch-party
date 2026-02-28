// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let rooms = {}; // In-memory rooms

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // JOIN ROOM
  socket.on("join_room", ({ roomId, username }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        videoId: "dQw4w9WgXcQ",
        isPlaying: false,
        currentTime: 0,
        hostId: socket.id,
        users: {},
      };
    }

    const room = rooms[roomId];
    const role = socket.id === room.hostId ? "HOST" : "PARTICIPANT";

    room.users[socket.id] = { username, role };
    socket.join(roomId);

    socket.emit("sync_state", {
      videoId: room.videoId,
      currentTime: room.currentTime,
      isPlaying: room.isPlaying,
    });

    io.to(roomId).emit("room_update", room);
  });


  // PLAY
  socket.on("play", ({ roomId, currentTime }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId && room.users[socket.id]?.role !== "MODERATOR") return;

    room.isPlaying = true;
    room.currentTime = currentTime || room.currentTime || 0;

    io.to(roomId).emit("play");
  });

  
  // PAUSE
  socket.on("pause", ({ roomId, currentTime }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId && room.users[socket.id]?.role !== "MODERATOR") return;

    room.isPlaying = false;
    room.currentTime = currentTime || room.currentTime || 0;

    io.to(roomId).emit("pause");
  });

  // SEEK
  socket.on("seek", ({ roomId, time }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId && room.users[socket.id]?.role !== "MODERATOR") return;

    room.currentTime = time;
    io.to(roomId).emit("seek", { time });
  });

  
  // CHANGE VIDEO
  
  socket.on("change_video", ({ roomId, videoId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId && room.users[socket.id]?.role !== "MODERATOR") return;

    room.videoId = videoId;
    room.currentTime = 0;
    room.isPlaying = false;

    io.to(roomId).emit("change_video", { videoId });
  });

  
  // REMOVE USER
  
  socket.on("remove_user", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId) return;

    delete room.users[userId];
    io.to(userId).emit("removed_by_host");
    io.to(roomId).emit("room_update", room);
  });

  
  // MAKE HOST / ASSIGN MODERATOR
  
  socket.on("make_host", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId) return;

    room.hostId = userId;
    for (let id in room.users) {
      room.users[id].role = id === userId ? "HOST" : "PARTICIPANT";
    }
    io.to(roomId).emit("room_update", room);
  });

  socket.on("make_moderator", ({ roomId, userId }) => {
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostId) return;

    if (room.users[userId]) room.users[userId].role = "MODERATOR";
    io.to(roomId).emit("room_update", room);
  });

  
  // CHAT
  
  socket.on("chat_message", ({ roomId, username, message }) => {
    io.to(roomId).emit("chat_message", { username, message });
  });

  
  // DISCONNECT
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    for (let roomId in rooms) {
      const room = rooms[roomId];
      if (room.users[socket.id]) {
        delete room.users[socket.id];

        const remainingUsers = Object.keys(room.users);
        
        // BONUS FIX: Delete the room if it's empty to prevent memory leaks over time
        if (remainingUsers.length === 0) {
          delete rooms[roomId];
          continue;
        }

        // If host leaves → assign new host
        if (room.hostId === socket.id) {
          const newHostId = remainingUsers[0];
          room.hostId = newHostId;
          
          // BUG FIX 3: Give the new host their role WITHOUT wiping existing moderators
          room.users[newHostId].role = "HOST";
        }

        io.to(roomId).emit("room_update", room);
      }
    }
  });
});


// START SERVER
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));