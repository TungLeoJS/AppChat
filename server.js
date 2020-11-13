const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const rooms = {};

app.get("/", (req, res) => {
  res.render("index", { rooms: rooms });
});

app.get("/:room", (req, res) => {
  if (rooms[req.params.room] != null) {
    res.render("room", { roomName: req.params.room });
  } else {
    io.emit("room-not-existed", req.params.room);
    res.redirect("/");
  }

  console.log(rooms[req.params.room]);
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    io.emit("room-existed", req.body.room);
    res.redirect("/");
  }
  rooms[req.body.room] = { users: {} };
  // res.redirect(req.body.room);
  io.emit("room-created", req.body.room);
});

io.on("connection", (socket) => {
  socket.on("send-chat-message", (room, message) => {
    socket.to(room).broadcast.emit("chat-message", {
      message: message,
      name: rooms[room].users[socket.id],
    });
  });

  socket.on("new-user", (room, name, userId) => {
    socket.join(room);
    rooms[room].users[socket.id] = name;
    socket.to(room).emit("user-connected", name, userId);
    console.log(`peerid: ${userId}`);
    console.log(rooms);
    socket.on("disconnect", () => {
      getUserRooms(socket).forEach((room) => {
        socket
          .to(room)
          .broadcast.emit(
            "user-disconnected",
            rooms[room].users[socket.id],
            userId
          );
        delete rooms[room].users[socket.id];
        console.log(userId);
      });
    });
    socket.on("leave", (userId) => {
      getUserRooms(socket).forEach((room) => {
        socket
          .to(room)
          .broadcast.emit("user-leave", rooms[room].users[socket.id], userId);
        delete rooms[room].users[userId];
        console.log(userId);
      });
    });
  });
});

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((names, [name, room]) => {
    if (room.users[socket.id] != null) names.push(name);
    return names;
  }, []);
}

server.listen(process.env.PORT || 3000);