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
let fakevideostream;
var currentPeer = [];
const senders = [];
const constrain = {
    audio: true,
    video: { width: 1280, height: 720 },
}
const getUserDevice = constrain =>  navigator.mediaDevices
.getUserMedia(constrain)
  
  getUserDevice(constrain)
  .then((stream) => {
    console.log(stream)
    myVideoStream = stream;
    console.log("Camera and mic on!")
    addVideoStream(myVideo, stream, name, peers[name]);
    // addUserName(Object.keys(peers)[Object.values(peers).indexOf(myPeer._id)]);
    myPeer.on("call", (call) => {
      console.log("someone called")
      const callerName = call.metadata.callerName;
      peers[callerName] = call.peer;
      call.answer(stream);
      console.log("answer with stream")
      const video = document.createElement("video");
      call.on("stream", userVideoStream => {
        setTimeout(() => {
          addVideoStream(video, userVideoStream, callerName, peers[callerName]);
          const videoElement = document.getElementById(`videogridofuser${callerName}`);
          addMuteButton(videoElement, video)
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
  }, () => {
    console.log("Permission denied!");
    fakevideostream = createMediaStreamFake();
    console.log(fakevideostream);
    myVideoStream = fakevideostream;
    addVideoStream(myVideo, fakevideostream, name, peers[name]);
    myPeer.on("call", (call) => {
      console.log("calling")
      const callerName = call.metadata.callerName;
      peers[callerName] = call.peer;
      call.answer(fakevideostream);
      const video = document.createElement("video");
      video.muted = true;
      call.on("stream", (userVideoStream) => {
        console.log("calling 2")
        setTimeout(() => {
          addVideoStream(video, userVideoStream, callerName, peers[callerName]);
          const videoElement = document.getElementById(`videogridofuser${callerName}`);
          addMuteButton(videoElement, video)
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
        connectToNewUser(userId, fakevideostream, name);
      }, 500);
    });
  } 
  )
  .catch(err => {
    console.log(err.message)
  })

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
  console.log("calling")
  console.log(stream)
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("connect to new user");
    addVideoStream(video, userVideoStream, name, userId);
    const videoElement = document.getElementById(`videogridofuser${name}`);
    addMuteButton(videoElement, video)
    currentPeer.push(call.peerConnection);
  });
  call.on("close", () => {
    if(video != null){
      video.remove();
      console.log("closed");
    }
    else{
      console.log("close")
    }
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
  if(a != null && b!= null){
    a.remove();
    b.remove();
  }
  else{
    console.log("remove name");
  }
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
  if(myVideoStream.getVideoTracks()[0] == undefined){
    console.log("My video stream not found")
  }else{
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
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
  console.log(createMediaStreamFake());
};

const startShareScreen = async () => {
  await navigator.mediaDevices.getDisplayMedia().then((stream) => {
    let videoTrack = stream.getVideoTracks()[0];
    currentPeer.forEach((peer) => {
      var sender = peer.getSenders().find((s) => s.track.kind === "video");
      sender.replaceTrack(videoTrack);
    });
    myVideo.srcObject = stream;
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

const createMediaStreamFake = () => {
  return new MediaStream([createEmptyAudioTrack(), createEmptyVideoTrack({ width:640, height:480 })]);
}

const createEmptyAudioTrack = () => {
const ctx = new AudioContext();
const oscillator = ctx.createOscillator();
const dst = oscillator.connect(ctx.createMediaStreamDestination());
oscillator.start();
const track = dst.stream.getAudioTracks()[0];
return Object.assign(track, { enabled: false });
}

const createEmptyVideoTrack = ({ width, height }) => {
const canvas = Object.assign(document.createElement('canvas'), { width, height });
canvas.getContext('2d').fillRect(0, 0, width, height);

const stream = canvas.captureStream();
const track = stream.getVideoTracks()[0];

return Object.assign(track, { enabled: false });
}

const addMuteButton = (videoElement, video) => {
  var mutebutton = document.createElement("button");
  var i = document.createElement("i");
          mutebutton.setAttribute("class", "fas fa-volume-mute");
          videoElement.append(mutebutton)
          mutebutton.append(i)
          mutebutton.style.width = "30px";
          mutebutton.style.height = "30px";
          mutebutton.style.border = "none";
          if(video.muted == true){
            mutebutton.style.background = "red";
          }else{
            mutebutton.style.background = "white";
          }
          mutebutton.addEventListener("click", () => {
            console.log(video.muted)
              if(video.muted == false){
                video.muted = !video.muted;
                mutebutton.style.background = "red";
              }else{
                video.muted = !video.muted;
                mutebutton.style.background = "white";
              }
          })
}
