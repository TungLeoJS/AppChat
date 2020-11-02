const socket = io("/");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3000",
});

const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");
const videoGrid = document.getElementById("video-grid");

socket.on("room-created", (room) => {
  const roomElement = document.createElement("div");
  roomElement.innerText = room;
  const roomLink = document.createElement("a");
  roomLink.href = `/${room}`;
  roomLink.innerText = "join";
  roomContainer.append(roomElement);
  roomContainer.append(roomLink);
});

if (messageForm != null) {
  messageAppend("You joined");
  const name = prompt("What is your name?");
  myPeer.on("open", (id) => {
    socket.emit("new-user", roomName, name, id);
  });
}

const myVideo = document.createElement("video");
myVideo.muted = true;
let myVideoStream;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });
    socket.on("user-connected", (name, userId) => {
      messageAppend(`${name} has connected with userId: ${userId}`);
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 5000);
    });
  });

socket.on("user-disconnected", (name, userId) => {
  messageAppend(`${name} has disconnected`);
  if (peers[userId]) peers[userId].close();
});

socket.on("chat-message", (data) => {
  messageAppend(`${data.name}: ${data.message}`);
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  socket.emit("send-chat-message", roomName, message);
  messageAppend(`You: ${message}`);
  messageInput.value = "";
});

function messageAppend(message) {
  const messageElement = document.createElement("div");
  messageElement.innerText = message;
  messageContainer.append(messageElement);
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  peers[userId] = call;
}