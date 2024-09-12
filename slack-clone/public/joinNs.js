// we could ask the server for fresh info on this NS, BAD!
// we have socket.io, and the server will tell us when something bad has happened!

const joinNs = (element, nsData) => {
  const nsEndpoint = element.getAttribute("ns");
  console.log({ selectedEndpoint: nsEndpoint });

  const clickedNs = nsData.find((row) => row.endpoint === nsEndpoint);
  // global so we can submit new messsage to the right place
  selectedNsId = clickedNs.id;
  const rooms = clickedNs.rooms;

  //! get the room-list div
  let roomList = document.querySelector(".room-list");
  //! clear it out
  roomList.innerHTML = "";

  // init firstRoomTitle var
  let firstRoomTitle;

  //! loop through each room, and add it to the DOM
  rooms.forEach((room, idx) => {
    if (idx === 0) {
      firstRoomTitle = room.roomTitle;
    }
    roomList.innerHTML += `<li class="room" nameSpaceId=${room.namespaceId}>
    <span class="fa-solid fa-${room.privateRoom ? "lock" : "globe"}"></span>${
      room.roomTitle
    }
    </li>`;
  });

  // init join first room
  joinRoom(firstRoomTitle, clickedNs.id);

  // add click listener to each room so the client can tell the server it wants to join!
  const roomNodes = document.querySelectorAll(".room");
  Array.from(roomNodes).forEach((elem) => {
    elem.addEventListener("click", (e) => {
      const nameSpaceId = elem.getAttribute("nameSpaceId");
      joinRoom(e.target.innerText, nameSpaceId);
    });
  });

  localStorage.setItem("lastNs", nsEndpoint);
};
