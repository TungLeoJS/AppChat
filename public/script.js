const socket = io("/");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3000",
  path: "/peerjs",
});
  messageAppend("You joined");
  const name = prompt("What is your name?");
if (messageForm != null) {
  myPeer.on("open", (id) => {
    socket.emit("new-user", roomName, name, id);
  });
}

socket.on("room-created", (room) => {
  const roomElement = document.createElement("div");
  roomElement.innerText = room;
  const roomLink = document.createElement("a");
  roomLink.href = `/${room}`;
  roomLink.innerText = "join";
  roomContainer.append(roomElement);
  roomContainer.append(roomLink);
});

const myVideo = document.createElement("video");
myVideo.muted = true;
let myVideoStream;
const peers = {};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: false
  })
  .then((stream) => {
    const overlay = document.createElement('div')
    overlay.setAttribute("class","overlay")
    const userName = document.createElement('p')
    userName.innerHTML = `${name}`
    overlay.append(userName)
    addVideoStream(myVideo, stream, overlay);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });
    socket.on("user-connected", (name, userId) => {
      messageAppend(`${name} has connected`);
      setTimeout(() => {
        connectToNewUser(userId, stream, name);
      }, 2000);
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


function addVideoStream(video, stream, name) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
  videoGrid.append(name);
}

function connectToNewUser(userId, stream, name) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  const userName = document.createElement('p')
  userName.innerHTML = `${name}`
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream, userName);
  });
  call.on("close", () => {
    video.remove();
    console.log("closed");
  });
  peers[userId] = call;
}
