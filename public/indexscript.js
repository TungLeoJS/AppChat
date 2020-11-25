const socket = io("/");

window.addEventListener("DOMContentLoaded", () => {
  const roomContainer = document.getElementById("room-container");
  const inputRoomName = document.querySelector(".input");
  const createButton = document.querySelector(".create");
  const roomName = document.querySelectorAll(".roomName")
  const deleteRoom = document.querySelectorAll(".delete")
  const rooms = [];

  const checkRoom = () => {
    if (rooms.includes(`${[inputRoomName.value]}`) == true) {
      alert(`Room has existed`);
    }
  };

  var roomHover = (element, delElement) => {
    for (let i = 0; i < element.length; i++) {
      rooms[i] = element[i].value;
      element[i].addEventListener("mouseover", () => {
        element[i].value = "Join";
      });
      element[i].addEventListener("mouseout", () => {
        element[i].value = `${rooms[i]}`;
      });
    }
  };

  createButton.addEventListener("click", checkRoom);

  socket.on("room-created", (room) => {
    const roomElementList = document.createElement("li");
    const roomElementForm = document.createElement("form");
    const roomElementInput = document.createElement("input");
    const roomElementDeleteInput = document.createElement("input");
    roomElementInput.type = "submit";
    roomElementInput.value = `${room}`;
    roomElementInput.className = "roomName";
    roomElementInput.formAction = `/${room}`;
    roomElementDeleteInput.value = "del";
    roomElementDeleteInput.className = "delete";
    roomElementDeleteInput.type = "submit";
    roomElementForm.append(roomElementInput);
    roomElementForm.append(roomElementDeleteInput);
    roomElementList.append(roomElementForm);
    roomContainer.append(roomElementList);
    const roomName = document.querySelectorAll(".roomName");
    const deleteRoom = document.querySelectorAll(".delete");
    roomHover(roomName, deleteRoom);
  });

  roomHover(roomName, deleteRoom);
});
