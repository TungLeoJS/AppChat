const socket = io("/");

window.addEventListener("DOMContentLoaded", () => {
  const roomContainer = document.getElementById("room-container");
  const joinRoom = document.querySelectorAll(".roomNameList");
  const inputRoomName = document.querySelector(".input");
  const createButton = document.querySelector(".create");
  const rooms = [];

  const checkRoom = () => {
    if (rooms.includes(`${[inputRoomName.value]}`) == true) {
      alert(`Room has existed`);
    }
  };

  var roomHover = (element) => {
    for (let i = 0; i < element.length; i++) {
      rooms[i] = element[i].value;
      element[i].addEventListener("mouseover", () => {
        element[i].value = "join";
      });
      element[i].addEventListener("mouseout", () => {
        element[i].value = rooms[i];
      });
    }
  };

  createButton.addEventListener("click", checkRoom);

  socket.on("room-created", (room) => {
    const roomElementList = document.createElement("li");
    const roomElementForm = document.createElement("form");
    roomElementForm.action = `/${room}`;
    const roomElementInput = document.createElement("input");
    roomElementInput.className = "roomNameList";
    roomElementInput.type = "submit";
    roomElementInput.value = `${room}`;
    roomElementForm.append(roomElementInput);
    roomElementList.append(roomElementForm);
    roomContainer.append(roomElementList);
    const joinRoom = document.querySelectorAll(".roomNameList");
    roomHover(joinRoom);
  });

  roomHover(joinRoom);
});
