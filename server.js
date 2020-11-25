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
app.use(express.static(__dirname +'/public'))

const rooms = {};

app.get("/", (req, res) => {
  res.render("index", { rooms: rooms });
});

app.get("/:room", (req, res) => {
  if (rooms[req.params.room] != null) {
    res.render("room", { roomName: req.params.room });
  } else {
    console.log("Room not existed")
    res.redirect("/");
  }
});

app.post("/room", (req, res) => {
  if (rooms[req.body.room] != null) {
    res.redirect("/");
  }
  rooms[req.body.room] = { users: {} };
  res.redirect("/");
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
    socket.to(room).broadcast.emit("user-connected", name, userId);
    console.log(rooms)
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
        console.log(rooms);
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