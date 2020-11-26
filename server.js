const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4 } = require("uuid");

app.use("/peerjs", peerServer);
app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

const rooms = {};

app.get("/", (req, res) => {
  res.render("index", { rooms: rooms });
});

app.get("/:room", (req, res) => {
  res.render("room", { roomName: req.params.room });
  if(rooms[req.params.room] == null){
    rooms[req.params.room] = { users: {} };
  }
});

app.post("/room", (req, res) => {
  res.redirect(`/${uuidV4()}`);
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
        const usersArr = Object.keys(rooms[room].users).length;
        if (usersArr == 0) {
          delete rooms[room];
        }
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