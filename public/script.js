const socket = io("/");
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");
const videoGrid = document.getElementById('video-grid');



myPeer.on('open', id => {
  socket.emit('new-user', roomName, id)
})



socket.on("room-created", (room) => {
  // <div><%= room %></div>
  // <a href="/<%= room %>">Join</a>

  const roomElement = document.createElement("div");
  roomElement.innerText = room;
  const roomLink = document.createElement("a");
  roomLink.href = `/${room}`;
  roomLink.innerText = "join";
  roomContainer.append(roomElement);
  roomContainer.append(roomLink);
});

if (messageForm != null) {
  const name = prompt("What is your name?");
  messageAppend("You joined");
  socket.emit("new-user", roomName, name);
}

const myVideo = document.createElement('video');
myVideo.muted = true;
let myVideoStream;
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
})

socket.on("user-connected", (name) => {
  messageAppend(`${name} has connected`);
});

socket.on("user-disconnected", (name) => {
  messageAppend(`${name} has disconnected`);
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

function addVideoStream(video, stream){
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  })
  videoGrid.append(video);
}
