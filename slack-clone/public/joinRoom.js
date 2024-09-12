const joinRoom = async (roomTitle, nameSpaceId) => {
  const ackRes = await nameSpaceSockets[nameSpaceId].emitWithAck("joinRoom", {
    roomTitle,
    nameSpaceId,
  });

  document.querySelector(
    ".curr-room-num-users"
  ).innerHTML = `${ackRes.numUsers} <span class="fa-solid fa-user"></span>`;
  document.querySelector(".curr-room-text").innerHTML = roomTitle;

  // we get back the room history in the acknowledge as well!
  document.querySelector("#messages").innerHTML = "";
  console.log({ history: ackRes.thisRoomsHistory });

  ackRes.thisRoomsHistory.forEach((messageObj) => {
    document.querySelector("#messages").innerHTML += `${buildMessageHtml(
      messageObj
    )}`;
  });
};
