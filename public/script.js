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
const shareScreen = document.querySelector("#shareScreen");
const sideBar = document.querySelector(".sidebar");
const sidebarToggle = document.querySelector("#sidebar-toggle");
const closeBtn = document.querySelector(".close-btn");
const listName = document.querySelector(".list_name")

sidebarToggle.addEventListener("click", () => {
    sideBar.classList.toggle("show-sidebar");
})

closeBtn.addEventListener("click", () => {
    if(sideBar.classList.contains("show-sidebar")){
        sideBar.classList.remove("show-sidebar");
    }
})

const myPeer = new Peer(undefined, {
  host: "/",
  port: "443",
  path: "/peerjs",
});

const peers = {};
const joinRoom = () => {
  const inviteLinkInput = document.getElementById("invite-link-input");
  const url = inviteLinkInput.value;
  document.location.href = url;
  inviteLinkInput.value = "";
};

const messageAppend = (message) => {
  if (message != null) {
    const messageElement = document.createElement("div");
    messageElement.innerText = message;
    messageContainer.append(messageElement);
  }
}

messageAppend("You joined");
const name = prompt("What is your name?");
if (name == "" || name == undefined || name == null) {
  document.location.href = "/";
  alert("Please enter your name !");
} else {
  socket.on("username-existed", () => {
    alert(`UserName has existed, please enter another UserName!`);
    document.location.href = "/";
  });
  myPeer.on("open", (id) => {
    socket.emit("new-user", roomName, name, id);
    console.log(`new user connected ${name}`);
    peers[name] = id;
  });
}
const myVideo = document.createElement("video");
myVideo.muted = true;
let myVideoStream;
var currentPeer = [];
const senders = [];
navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: { width: 1280, height: 720 },
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, name);
    console.log(peers)
    console.log(myPeer);
    setInterval(() => {
      console.log(peers);
      console.log(myPeer)
    }, 5000);
    // addUserName(Object.keys(peers)[Object.values(peers).indexOf(myPeer._id)]);
    myPeer.on("call", (call) => {
      const callerName = call.metadata.callerName;
      peers[callerName] = call.peer;
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        console.log("connect to caller");
        setTimeout(() => {
          addVideoStream(video, userVideoStream, callerName, peers[callerName]);
          currentPeer.push(call.peerConnection);
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
    });
  });

socket.on("user-disconnected", (name, userId) => {
  if (name != null) {
    messageAppend(`${name} has disconnected`);
    if (peers[userId]) peers[userId].close();
    delete peers[userId];
    delete peers[name];
    removeName(name);
  }
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

const addVideoStream = (video, stream, name, userId) => {
  video.srcObject = stream;
  video.controls = true;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  const videoGrid2 = document.createElement("div");
  videoGrid2.setAttribute("id", `videogridofuser${name}`);
  const listNameItem = document.createElement("li");
  listNameItem.setAttribute("id",`list_name_items_of_user_${name}`);
  listName.appendChild(listNameItem)
  videoGrid.appendChild(videoGrid2);
  videoGrid2.append(video);
  const element = document.querySelectorAll(`#videogridofuser${name}`);
  const element2 = document.querySelectorAll(`#list_name_items_of_user_${name}`)
  addUserName(name, element);
  addUserName(name, element2, userId);
}

const connectToNewUser = (userId, stream, name) => {
  const callerName = Object.keys(peers)[
    Object.values(peers).indexOf(myPeer._id)
  ];
  const call = myPeer.call(userId, stream, {
    metadata: { callerName: callerName },
  });
  console.log("calling");
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("connect to new user");
    addVideoStream(video, userVideoStream, name, userId);
    currentPeer.push(call.peerConnection);
  });
  call.on("close", () => {
    video.remove();
    console.log("closed");
  });
  peers[userId] = call;
}

const addUserName = async (name, element, userId) => {
  const p = document.createElement("p");
  p.setAttribute("id", `${name}`);
  p.innerHTML = name;
  const p2 = document.createElement("p")
  p2.innerHTML = `- Username: ${name} (Id: ${userId})`;
    if (element.length > 1) {
      element[0].remove();
      element[0].nodeName == "DIV" ? element[element.length - 1].append(p) :element[element.length - 1].append(p2);
    } else {
      element[0].nodeName == "DIV" ? element[0].append(p) : element[0].append(p2);
    }
};

const removeName = (name) => {
  const a = document.getElementById(`videogridofuser${name}`);
  const b = document.getElementById(`list_name_items_of_user_${name}`)
  a.remove();
  b.remove();
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
  <span>Share Screen</span>`;
  document.querySelector("#shareScreen").innerHTML = html;
  let videoTrack = myVideoStream.getVideoTracks()[0];
  let streamTrack = myVideo.srcObject.getVideoTracks()[0];
  streamTrack.stop();
  console.log(`ScreenSharing ended!`);
  currentPeer.forEach((peer) => {
    var sender = peer.getSenders().find((s) => s.track.kind === "video");
    sender.replaceTrack(videoTrack);
  });
  myVideo.srcObject = myVideoStream;
};

const startShareScreen = async () => {
  await navigator.mediaDevices.getDisplayMedia().then((stream) => {
    let videoTrack = stream.getVideoTracks()[0];
    currentPeer.forEach((peer) => {
      var sender = peer.getSenders().find((s) => s.track.kind === "video");
      sender.replaceTrack(videoTrack);
      myVideo.srcObject = stream;
    });
    const html = `<i class="fas fa-eye-slash"></i>
    <span>Stop Share</span>`;
    document.querySelector("#shareScreen").innerHTML = html;
    videoTrack.onended = () => {
      stopShareScreen();
    };
  });
};

shareScreen.addEventListener("click", () => {
  myVideoStream != myVideo.srcObject ? stopShareScreen() : startShareScreen();
});
