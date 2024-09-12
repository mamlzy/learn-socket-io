const express = require("express");
const app = express();
const socketio = require("socket.io");

const namespaces = require("./data/namespaces");
const Room = require("./classes/Room");

app.use(express.static(__dirname + "/public"));

const expressServer = app.listen(9000);
const io = socketio(expressServer);

// manufactured way to change an ns (without building a huge UI)
app.get("/change-ns", (req, res) => {
  // update namespaces array
  namespaces[0].addRoom(new Room(0, "Deleted Articles", 0));
  // let everyone know in THIS namespace, that it changed
  io.of(namespaces[0].endpoint).emit("nsChanged", namespaces[0]);
  res.json(namespaces[0]);
});

io.on("connection", (socket) => {
  socket.emit("welcome", "Welcome to the server.");
  socket.on("clientConnect", (data) => {
    console.log(socket.id, "has connected");
    socket.emit("nsList", namespaces);
  });
});

namespaces.forEach((namespace) => {
  io.of(namespace.endpoint).on("connection", (socket) => {
    console.log(`${socket.id} has connected to ${namespace.endpoint}`);

    socket.on("joinRoom", async (roomObj, ackCallback) => {
      // need to fetch the history
      const thisNs = namespaces[roomObj.nameSpaceId];
      const thisRoomObj = thisNs.rooms.find(
        (room) => room.roomTitle === roomObj.roomTitle
      );
      const thisRoomsHistory = thisRoomObj.history;
      console.log({ thisRoomObj, thisRoomsHistory });

      // leave all rooms (except own room), because the client can only be in one room
      const rooms = socket.rooms;

      rooms.forEach((room, idx) => {
        // we don't want to leave the socket's personal room which is guaranteed to be the first
        if (idx !== 0) {
          socket.leave(room);
        }
      });

      // join the room!
      // NOTE - roomTitle is coming from the client. Which is NOT safe.
      // Auth to make sure the socket has right to be in that room
      socket.join(roomObj.roomTitle);

      // fetch the number of sockets in this room
      const sockets = await io
        .of(namespace.endpoint)
        .in(roomObj.roomTitle)
        .fetchSockets();
      const socketCount = sockets.length;

      ackCallback({ numUsers: socketCount, thisRoomsHistory });
    });

    socket.on("newMessageToRoom", (messageObj) => {
      // console.log(messageObj);
      // broadcast to all the connected clients... this room only!
      // how can we find out what rooom THIS socket is in?
      const rooms = socket.rooms;
      console.log("newMessage api:", rooms);
      const currentRoom = [...rooms][0];
      console.log({ currentRoom });
      // send out this messageObj to everyone including the sender
      io.of(namespace.endpoint)
        .in(currentRoom)
        .emit("messageToRoom", messageObj);

      const thisNs = namespaces[messageObj.selectedNsId];
      const thisRoom = thisNs.rooms.find(
        (room) => room.roomTitle === currentRoom
      );

      thisRoom.addMessage(messageObj);

      console.log({ thisRoom, messageObj });
    });
  });
});
