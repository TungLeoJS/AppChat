const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4 } = require("uuid");
const { uuid } = require("uuidv4");

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
  if (rooms[req.params.room] == null) {
    rooms[req.params.room] = { users: {} };
  }
});

app.post("/room", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

io.on("connection", (socket) => {
  socket.on("new-user", (room, name, userId) => {
    if (rooms[room] == null) {
      rooms[room] = { users: {} };
    }
    socket.join(room);
    if (Object.values(rooms[room].users).includes(name) == true) {
      console.log("username has existed");
      socket.emit("username-existed");
    } else {
      rooms[room].users[socket.id] = name;
      socket.to(room).emit("user-connected", name, userId);
      console.log(`user ${rooms[room].users[socket.id]} has connected`);
      console.log(rooms);
    }

    socket.on("send-chat-message", (room, message) => {
      socket.to(room).broadcast.emit("chat-message", {
        message: message,
        name: rooms[room].users[socket.id],
      });
    });

    socket.on("PermissionDenied", userName => {
      socket.to(room).broadcast.emit("PermissionDeniedAlert", userName)
      console.log("permission denied")
    })

    socket.on("disconnect", () => {
      socket
        .to(room)
        .broadcast.emit(
          "user-disconnected",
          rooms[room].users[socket.id],
          userId
        );
      console.log(`user ${rooms[room].users[socket.id]} has disconnected`);
      delete rooms[room].users[socket.id];
      const usersArr = Object.keys(rooms[room].users).length;
      if (usersArr == 0) {
        delete rooms[room];
      }
    });
  });
});

server.listen(process.env.PORT || 3000);
