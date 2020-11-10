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
    audio: true
  })
  .then((stream) => 
  {
    myVideoStream = stream
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        console.log(myPeer)
      });
    });
    socket.on("user-connected", (name, userId) => {
      messageAppend(`${name} has connected`);
      setTimeout(() => {
        connectToNewUser(userId, stream);
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
    console.log("closed");
  });
  peers[userId] = call;
}

const scrollToBottom = () => {
var d = $('.main__chat_window');
d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {
const enabled = myVideoStream.getAudioTracks()[0].enabled;
if (enabled) {
  myVideoStream.getAudioTracks()[0].enabled = false;
  setUnmuteButton();
} else {
  setMuteButton();
  myVideoStream.getAudioTracks()[0].enabled = true;
}
}

const playStop = () => {
console.log('object')
let enabled = myVideoStream.getVideoTracks()[0].enabled;
if (enabled) {
  myVideoStream.getVideoTracks()[0].enabled = false;
  setPlayVideo()
} else {
  setStopVideo()
  myVideoStream.getVideoTracks()[0].enabled = true;
}
}

const setMuteButton = () => {
const html = `
  <i class="fas fa-microphone"></i>
  <span>Mute</span>
`
document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
const html = `
  <i class="unmute fas fa-microphone-slash"></i>
  <span>Unmute</span>
`
document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
const html = `
  <i class="fas fa-video"></i>
  <span>Stop Video</span>
`
document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
const html = `
<i class="stop fas fa-video-slash"></i>
  <span>Play Video</span>
`
document.querySelector('.main__video_button').innerHTML = html;
}