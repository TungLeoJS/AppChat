const socket = io("/");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const videoGrid = document.querySelector("#video-grid");
const leaveButton = document.getElementById("leave-button");
const showChat = document.getElementById("show-chat");
const mainLeft = document.getElementById("main__left");
const mainRight = document.getElementById("main__right");
const mainVideos = document.querySelector(".main__videos");
const shareScreen = document.querySelector('#shareScreen');

const myPeer = new Peer(undefined, {
  host: "/",
  port:"3000",
  path: '/peerjs'
});

const peers = {};
const joinRoom = () => {
  const inviteLinkInput = document.getElementById("invite-link-input");
  const url = inviteLinkInput.value;
  document.location.href = url;
  inviteLinkInput.value = "";
};

  messageAppend("You joined");
  const name = prompt("What is your name?");
  if (name != null) {
    socket.on("username-existed", () => {
      alert(`UserName has existed, please enter another UserName!`);
      document.location.href = "/";
    });
    myPeer.on("open", (id) => {
      socket.emit("new-user", roomName, name, id);
      console.log(`new user connected ${name}`)
      peers[name] = id;
    });
  } else if (name == "") {
    document.location.href = "/";
    alert("Please enter your name !");
  } else if (name == undefined) {
    document.location.href = "/";
    alert("Please enter your name !");
  }else if (name == null) {
    document.location.href = "/";
    alert("Please enter your name !");
  }

const myVideo = document.createElement("video");
myVideo.muted = true;
let myVideoStream;
var currentPeer = [];
const senders = [];
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: {width: 1280, height: 720},
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(
      myVideo,
      stream,
      name
    );
    console.log(name)
    // addUserName(Object.keys(peers)[Object.values(peers).indexOf(myPeer._id)]);
    myPeer.on("call", (call) => {
      const callerName = call.metadata.callerName;
      peers[callerName] = call.peer;
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        console.log('connect to caller')
        setTimeout(() => {
          addVideoStream(video, userVideoStream, callerName);
          currentPeer.push(call.peerConnection);
        }, 500);
        setTimeout(() => {
          // addUserName(callerName);
        }, 500);
        peers[call.peer] = call;
      });
      call.on("close", () => {
        video.remove();
        console.log("closed");
      });
      peers[call.peer] = call;
    });
    socket.on("user-connected", (name, userId) => {
      peers[name] = userId;
      messageAppend(`${name} has connected`);
      setTimeout(() => {
        connectToNewUser(userId, stream, name);
      }, 500);
      setTimeout(() => {
        // addUserName(name);
      }, 1000);
    });
  });

socket.on("user-disconnected", (name, userId) => {
  messageAppend(`${name} has disconnected`);
  if (peers[userId]) peers[userId].close();
  delete peers[userId];
  delete peers[name];
  removeName(name);
});

socket.on("chat-message", (data) => {
  messageAppend(`${data.name}: ${data.message}`);
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  if (message != "") {
    socket.emit("send-chat-message", roomName, message);
    messageAppend(`You: ${message}`);
    messageInput.value = "";
  }
});

function messageAppend(message) {
  if (message != null) {
    const messageElement = document.createElement("div");
    messageElement.innerText = message;
    messageContainer.append(messageElement);
  }
}

function addVideoStream(video, stream, name) {
  video.srcObject = stream;
  video.controls = true;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  const videoGrid2 = document.createElement("div");
  videoGrid2.setAttribute("id", `videogridofuser${name}`);
  videoGrid.appendChild(videoGrid2);
  videoGrid2.append(video);
  addUserName(name);
}

function connectToNewUser(userId, stream, name) {
  const callerName = Object.keys(peers)[
    Object.values(peers).indexOf(myPeer._id)
  ];
  const call = myPeer.call(userId, stream, {
    metadata: { callerName: callerName },
  });
  console.log("calling")
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("connect to new user")
    addVideoStream(video, userVideoStream, name);
    currentPeer.push(call.peerConnection);
  });
  call.on("close", () => {
    video.remove();
    console.log("closed");
  });
  peers[userId] = call;
}

const addUserName = async (name) => {
  // console.log(name)
  const p = document.createElement("p");
  p.setAttribute("id", `${name}`);
  p.innerHTML = name;
  const videoGrid2 = document.querySelectorAll(`#videogridofuser${name}`);
  if (videoGrid2.length > 1) {
    videoGrid2[0].remove();
    videoGrid2[videoGrid2.length - 1].append(p);
  } else {
    videoGrid2[0].append(p);
  }
};

const removeName = (name) => {
  const a = document.getElementById(`videogridofuser${name}`);
  a.remove();
};

const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
  <i class="fas fa-microphone"></i>
  <span>Mute</span>
`;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `
  <i class="unmute fas fa-microphone-slash"></i>
  <span>Unmute</span>
`;
  document.querySelector(".main__mute_button").innerHTML = html;
};

const setStopVideo = () => {
  const html = `
  <i class="fas fa-video"></i>
  <span>Stop Video</span>
`;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
<i class="stop fas fa-video-slash"></i>
  <span>Play Video</span>
`;
  document.querySelector(".main__video_button").innerHTML = html;
};

showChat.addEventListener("click", () => {
  if (mainRight.style.display != "none") {
    mainLeft.style.flex = "1";
    mainRight.style.display = "none";
  } else {
    mainLeft.style.flex = "0.79";
    mainRight.style.display = "flex";
  }
});

leaveButton.addEventListener("click", () => {
  const userId = myPeer.id;
  socket.emit("disconnect");
  document.location.href = "/";
  alert("You have leaved the room");
});

const Share = () => {
  var dummy = document.createElement("input"),
    url = window.location.href;
  document.body.appendChild(dummy);
  dummy.value = url;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  alert(
    ` Url Copied to Clipboard,\n Share it with your Friends!\n Url: ${url} `
  );
};

const stopShareScreen = async () => {
  const html = `<i class="fas fa-desktop"></i>
  <span>Share Screen</span>`
  document.querySelector('#shareScreen').innerHTML = html;
  let videoTrack = myVideoStream.getVideoTracks()[0];
  let streamTrack = myVideo.srcObject.getVideoTracks()[0];
  streamTrack.stop();
  console.log(`ScreenSharing ended!`)
  currentPeer.forEach((peer) => {
    var sender = peer.getSenders().find((s) => s.track.kind === "video");
    sender.replaceTrack(videoTrack);
  });
  myVideo.srcObject = myVideoStream;
};

const startShareScreen = async () => {
  const html = `<i class="fas fa-eye-slash"></i>
  <span>Stop Share</span>`
  document.querySelector('#shareScreen').innerHTML = html;
  await navigator.mediaDevices.getDisplayMedia().then((stream) => {
    let videoTrack = stream.getVideoTracks()[0];
    currentPeer.forEach((peer) => {
      var sender = peer.getSenders().find(s => s.track.kind === "video");
      sender.replaceTrack(videoTrack);
      myVideo.srcObject = stream;
    });
    videoTrack.onended = () => {
      stopShareScreen();
    };
  });
}

shareScreen.addEventListener('click', () => {
  (myVideoStream != myVideo.srcObject) ? stopShareScreen() : startShareScreen()
})