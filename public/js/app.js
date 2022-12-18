window.addEventListener("load", () => {
  // Put all client-side code here

  //Chat Platform
  const chatTemplate = Handlebars.compile($("#chat-template").html());
  const chatContentTemplate = Handlebars.compile(
    $("#chat-content-template").html()
  );
  const chatEl = $("#chat");
  const formEl = $(".form");

  const messages = [];

  let username;

  //Local Video

  const localImageEl = $("#local-image");
  const localVideoEl = $("#local-video");

  //Remote Videos
  const remoteVideoTemplete = Handlebars.compile(
    $("#remote-video-template").html()
  );

  const remoteVideosEl = $("#remote-videos");

  let remoteVideosCount = 0;

  //Add validation rules to Create/Join Room Form

  formEl.form({
    fields: {
      roomName: "empty",
      userName: "empty",
    },
  });

  //create our WebRTC connection
  const webrtc = new SimpleWebRTC({
    // the id/element dom element that will hold "our" video
    localVideoEl: "local-video",
    // the id/element dom element that will hold remote videos
    remoteVideosEl: "remote-videos",
    //immediately ask for camera access
    autoRequestMedia: true,
  });

  //We got access to local camera
  webrtc.on("localStream", () => {
    localImageEl.hide();
    localVideoEl.show();
  });

  //Remote video was added
  webrtc.on("videoAdded", (video, peer) => {
    const id = webrtc.getDomId(peer);
    const html = remoteVideoTemplete({ id });
    if (remoteVideosCount === 0) {
      remoteVideosEl.html(html);
    } else {
      remoteVideosEl.append(html);
    }
    $(`#${id}`).html(video);
    $(`#${id} video`).addClass("ui image medium"); //make video element responsive
    remoteVideosCount += 1;
  });

  //Update Chat Message
  const updateChatMessages = () => {
    const html = chatContentTemplate({ messages });
    const chatContentEl = $("#chat-content");
    chatContentEl.html(html);
    //automatically scroll downwards
    const scrollHeight = chatContentEl.prop("scrollHeight");
    chatContentEl.animate({ scrollTop: scrollHeight }, "slow");
  };

  webrtc.on("message", (data) => {
    if (data.type === "chat") {
      const message = data.payload;
      messages.push(message);
      updateChatMessages();
    }
  });

  //Post Local Message
  const postMessage = (message) => {
    const chatMessage = {
      username,
      message,
      postedOn: new Date().toLocaleString("en-GB"),
    };

    //Send to all peers
    webrtc.sendToAll("chat", chatMessage);

    //Update messages locally
    messages.push(chatMessage);
    $("#post-message").val("");
    updateChatMessages();
  };

  //Display Chat Interface
  const showChatRoom = (room) => {
    console.log(room);
    //Hide form
    formEl.hide();
    const html = chatTemplate({ room });
    chatEl.html(html);
    const postForm = $("form");

    //Post Message Validation Rules
    postForm.form({
      message: "empty",
    });
    $("#post-btn").on("click", () => {
      const message = $("#post-message").val();
      postMessage(message);
    });
    $("#post-message").on("keyup", (event) => {
      if (event.keyCode === 13) {
        const message = $("#post-message").val();
        postMessage(message);
      }
    });
  };

  //Register new chat room
  const createRoom = (roomName) => {
    console.info(`Creating new room:${roomName}`);
    console.log(webrtc.createRoom(roomName));
    webrtc.createRoom(roomName);
    showChatRoom(roomName);
    postMessage(`${username} created chatroom`);
  };

  //Join existing chat room
  const joinRoom = (roomName) => {
    console.log(`Joining Room: ${roomName}`);
    webrtc.joinRoom(roomName);
    showChatRoom(roomName);
    postMessage(`${username} joined chatroom`);
  };

  //Click Handler
  $(".submit").on("click", (event) => {
    if (!formEl.form("is valid")) {
      return false;
    }
    username = $("#username").val();
    const roomName = $("#roomName").val().toLowerCase();
    if (event.target.id === "create-btn") {
      createRoom(roomName);
    } else {
      joinRoom(roomName);
    }
    return false;
  });
});
