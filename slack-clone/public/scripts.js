const socket = io("http://localhost:9000");

socket.on("connect", () => {
  // console.log("Connected!");
  socket.emit("clientConnect");
});

// socket will be put into this array, because that's where the client gets the other namespaces from
const nameSpaceSockets = [];
const listeners = {
  nsChange: [],
  messageToRoom: [],
};

// a global variable we can update when the user clicks on a namespace
// we will use it to broadcast across the app
let selectedNsId = 0;

// add a submit handle for our form
document.querySelector("#message-form").addEventListener("submit", (e) => {
  e.preventDefault();

  // grab the value form the input box
  const newMessage = document.querySelector("#user-message").value;
  nameSpaceSockets[selectedNsId].emit("newMessageToRoom", {
    newMessage,
    date: new Date().getTime(),
    avatar: "https://via.placeholder.com/30",
    username: "mamlzy",
    selectedNsId,
  });
  document.querySelector("#user-message").value = "";
});

// addListener job is to manage all listeners added to all namespaces.
// this prevents listeners being added multiple times
const addListener = (nsId) => {
  if (!listeners.nsChange[nsId]) {
    nameSpaceSockets[nsId].on("nsChanged", (data) => {
      console.log("Namespace changed!", data);
    });
    listeners.nsChange[nsId] = true;
  }

  if (!listeners.messageToRoom[nsId]) {
    // add the nsId to this Namespace
    nameSpaceSockets[nsId].on("messageToRoom", (messageObj) => {
      document.querySelector("#messages").innerHTML +=
        buildMessageHtml(messageObj);
    });
    listeners.messageToRoom[nsId] = true;
  }
};

socket.on("nsList", (nsData) => {
  // console.log({ nsData });

  const lastNs = localStorage.getItem("lastNs");

  const namespacesDiv = document.querySelector(".namespaces");

  //! reset the namespaces div
  namespacesDiv.innerHTML = "";

  nsData.forEach((ns) => {
    //! update html with each ns
    namespacesDiv.innerHTML += `<div class="namespace" ns="${ns.endpoint}"><img src="${ns.image}"></div>`;

    //! initialize thisNs as its index in nameSpaceSockets.
    //! if the connection is new, this will be null
    //! if the connection has already been established, it will reconnect and remain in its spot
    // let thisNs = nameSpaceSockets[ns.id];

    if (!nameSpaceSockets[ns.id]) {
      //! there is no socket at this nsId. so make a new connection!
      //! join the namespace with io()
      nameSpaceSockets[ns.id] = io(`http://localhost:9000${ns.endpoint}`);
    }

    addListener(ns.id);
  });

  Array.from(document.getElementsByClassName("namespace")).forEach(
    (element) => {
      element.addEventListener("click", () => {
        joinNs(element, nsData);
      });
    }
  );

  //! if lastNs is set, grab that element instead of 0.
  const firstSelectedNs = lastNs
    ? Array.from(document.getElementsByClassName("namespace")).find(
        (element) => element.getAttribute("ns") === lastNs
      )
    : document.getElementsByClassName("namespace")[0];

  joinNs(firstSelectedNs, nsData);
});
