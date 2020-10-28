const socket = io("http://localhost:3000");
const messageForm = document.getElementById("send-container");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const roomContainer = document.getElementById("room-container");

if (messageForm != null) {
  const name = prompt("What is your name?");
  messageAppend("You joined");
  socket.emit("new-user", roomName, name);
}

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
