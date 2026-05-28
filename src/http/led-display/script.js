/** JavaScript for led-display.html.
 *  @author: Philip Taylor
 *  @editor: Jesse Phillips
 *  @version: 1.0.0
 **/
const timerEl = document.getElementById("timer");
const topLabelEl = document.getElementById("topLabel");
const bottomLabelEl = document.getElementById("bottomLabel");
const secondaryEl = document.getElementById("secondary");

const MESSAGE_API_BASE = "http://localhost:5500";

let lastTimeMessageAt = 0;
let messageState = { pending: "", active: "" };
let wasInExpiryState = false;
let isConsumingMessage = false;
let hasTriedConsumeThisExpiry = false;
let fastCandidateSince = 0;
let lastFastCandidateTime = null;

function clearTimerColours() {
  timerEl.classList.remove("red", "yellow", "green", "black");
}

function clearTextColours() {
  timerEl.classList.remove("red", "yellow", "green", "black");
  topLabelEl.classList.remove("red", "yellow", "green", "black");
  bottomLabelEl.classList.remove("red", "yellow", "green", "black");
  secondaryEl.classList.remove("red", "yellow", "green", "black");
}

function clearBackgroundColours() {
  document.body.classList.remove("bg-red", "bg-yellow", "bg-green", "bg-black");
}

function normalizeMessage(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, 40);
}

function setMessageState(state) {
  messageState.pending = normalizeMessage((state && state.pending) || "");
  messageState.active = normalizeMessage((state && state.active) || "");
}

function fetchMessageState() {
  return fetch(MESSAGE_API_BASE + "/api/message-state", {
    method: "GET",
    headers: { "Accept": "application/json" }
  })
    .then(r => r.json())
    .then(state => {
      setMessageState(state);
      return messageState;
    });
}

function consumePendingMessage() {
  return fetch(MESSAGE_API_BASE + "/api/message-state/consume", {
    method: "POST",
    headers: { "Accept": "application/json" }
  })
    .then(r => r.json())
    .then(state => {
      setMessageState(state);
      return messageState;
    });
}

function clearActiveMessage() {
  return fetch(MESSAGE_API_BASE + "/api/message-state/clear-active", {
    method: "POST",
    headers: { "Accept": "application/json" }
  })
    .then(r => r.json())
    .then(state => {
      setMessageState(state);
      return messageState;
    });
}

function tryConsumePendingMessageIfNeeded() {

  if (!wasInExpiryState || isConsumingMessage) {
    return;
  }

  isConsumingMessage = true;

  consumePendingMessage()
    .then(function () {

      if (wasInExpiryState && messageState.active) {
        showActiveMessage(messageState.active);
      }

      isConsumingMessage = false;
    })
    .catch(function () {
      isConsumingMessage = false;
    });
}

function getMessageFontSize(message) {
  const length = message.length;

  if (length <= 10) return "min(28vw, 40vh)";
  if (length <= 20) return "min(18vw, 28vh)";
  if (length <= 30) return "min(14vw, 20vh)";
  return "min(11vw, 16vh)";
}

function showNormalTimer(time1) {
  topLabelEl.textContent = "";
  topLabelEl.style.display = "none";
  timerEl.classList.remove("detail-display", "message-display", "fast-display");
  timerEl.style.fontSize = "";
  timerEl.textContent = time1;
}

function getWhoShootsLabel(whoShoots) {
  switch (Number(whoShoots)) {
    case 5:
    case 11:
      return "A B";

    case 6:
    case 12:
      return "C D";

    case 13:
      return "E F";

    default:
      return "";
  }
}

function showNextDetail(whoShoots) {
  const detailLabel = getWhoShootsLabel(whoShoots);

  topLabelEl.textContent = "NEXT DETAIL";
  topLabelEl.style.display = "block";
  timerEl.classList.remove("message-display", "fast-display");
  timerEl.classList.add("detail-display");
  timerEl.style.fontSize = "";
  timerEl.textContent = detailLabel;
  bottomLabelEl.textContent = "";
}

function showActiveMessage(message) {
  topLabelEl.textContent = "";
  topLabelEl.style.display = "none";
  timerEl.classList.remove("detail-display", "fast-display");
  timerEl.classList.add("message-display");
  timerEl.style.fontSize = getMessageFontSize(message);
  timerEl.textContent = message;
  bottomLabelEl.textContent = "";
}

function setDisconnectedState(isDisconnected) {
  if (isDisconnected) {
    document.body.classList.add("disconnected");
    document.body.classList.remove("mode-flag");
    clearBackgroundColours();
    document.body.classList.add("bg-black");
    clearTextColours();
    timerEl.classList.add("black");
    timerEl.classList.remove("detail-display", "message-display", "fast-display");
    timerEl.style.fontSize = "";
    timerEl.textContent = "--";
    topLabelEl.textContent = "";
    topLabelEl.style.display = "none";
    bottomLabelEl.textContent = "";
    secondaryEl.textContent = "";
    fastCandidateSince = 0;
    lastFastCandidateTime = null;
  } else {
    document.body.classList.remove("disconnected");
  }
}

function setLightAppearance(light, beacon) {
  clearTextColours();
  clearBackgroundColours();

  switch (light) {
    case 1:
      timerEl.classList.add("red");
      topLabelEl.classList.add("red");
      bottomLabelEl.classList.add("red");
      secondaryEl.classList.add("red");
      document.body.classList.add("bg-red");
      break;

    case 2:
      timerEl.classList.add("yellow");
      topLabelEl.classList.add("yellow");
      bottomLabelEl.classList.add("yellow");
      secondaryEl.classList.add("yellow");
      document.body.classList.add("bg-yellow");
      break;

    case 3:
      timerEl.classList.add("green");
      topLabelEl.classList.add("green");
      bottomLabelEl.classList.add("green");
      secondaryEl.classList.add("green");
      document.body.classList.add("bg-green");
      break;

    case 4:
      timerEl.classList.add("black");
      topLabelEl.classList.add("black");
      bottomLabelEl.classList.add("black");
      secondaryEl.classList.add("black");
      document.body.classList.add("bg-red");
      break;

    default:
      timerEl.classList.add("black");
      topLabelEl.classList.add("black");
      bottomLabelEl.classList.add("black");
      secondaryEl.classList.add("black");
      document.body.classList.add("bg-black");
      break;
  }
}

function setMode(whoShoots) {
  document.body.classList.remove("mode-flag");
  topLabelEl.textContent = "";
  topLabelEl.style.display = "none";
  bottomLabelEl.textContent = "";
  secondaryEl.textContent = "";

  switch (Number(whoShoots)) {
    case 5:
    case 6:
    case 11:
    case 12:
    case 13:
      bottomLabelEl.textContent = getWhoShootsLabel(whoShoots);
      break;

    case 9:
      document.body.classList.add("mode-flag");
      break;

    default:
      break;
  }
}

function isFastState(time1, light1, light2) {
  const isRedHold = time1 > 0 && light1 === 1 && light2 === 1;

  if (!isRedHold) {
    fastCandidateSince = 0;
    lastFastCandidateTime = null;
    return false;
  }

  // Exception: the normal "next end loaded" red waiting state at 10 seconds is not FAST.
  if (time1 === 10) {
    fastCandidateSince = 0;
    lastFastCandidateTime = null;
    return false;
  }

  if (lastFastCandidateTime !== time1) {
    lastFastCandidateTime = time1;
    fastCandidateSince = Date.now();
    return false;
  }

  if (fastCandidateSince === 0) {
    fastCandidateSince = Date.now();
    return false;
  }

  return Date.now() - fastCandidateSince >= 1200;
}

function showFast() {
  topLabelEl.textContent = "";
  topLabelEl.style.display = "none";
  timerEl.classList.remove("detail-display", "message-display", "fast-display");
  timerEl.classList.add("fast-display");
  timerEl.style.fontSize = "";
  timerEl.textContent = "FAST";
  bottomLabelEl.textContent = "";
  secondaryEl.textContent = "";
}

function isEndFinishedState(time1, light1, time2, light2, numbers, whoShoots) {
  const t1 = Number(time1);
  const l1 = Number(light1);
  const t2 = Number(time2);
  const l2 = Number(light2);
  const n = Number(numbers);
  const ws = Number(whoShoots);

  const isNormalDetailFinished =
  t1 === 0 &&
  l1 === 1 &&
  t2 === 0 &&
  l2 === 1 &&
  n === 3 &&
  (ws === 5 || ws === 6 || ws === 11 || ws === 12 || ws === 13 || ws === 0);

  const isSingleDetailFinished =
    t1 === 0 &&
    l1 === 1 &&
    t2 === 0 &&
    l2 === 1 &&
    n === 3 &&
    ws === 0;

  const isMakeupFinished =
    t1 === 0 &&
    l1 === 1 &&
    t2 === 0 &&
    l2 === 1 &&
    n === 2 &&
    ws === 0;

  return isNormalDetailFinished || isSingleDetailFinished || isMakeupFinished;
}

setDisconnectedState(true);

if (typeof io !== "undefined") {
  const socket = io("http://localhost:5001", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 3000,
    timeout: 5000,
    autoConnect: true
  });

  fetchMessageState().catch(function () { });

  setInterval(function () {
    fetchMessageState()
      .then(function () {
        if (wasInExpiryState && !messageState.active && messageState.pending) {
          tryConsumePendingMessageIfNeeded();
        }
      })
      .catch(function () { });
  }, 1000);

  socket.on("connect", function () {
  });

  socket.on("disconnect", function () {
    setDisconnectedState(true);
  });

  socket.on("connect_error", function () {
    setDisconnectedState(true);
  });

  setInterval(function () {
    if (lastTimeMessageAt !== 0 && Date.now() - lastTimeMessageAt > 3000) {
      setDisconnectedState(true);
    }
  }, 1000);

  setInterval(function () {
    if (!socket.connected) {
      try {
        socket.connect();
      } catch (e) {
      }
    }
  }, 2000);

  socket.on("timeMessage", function (time1, light1, time2, light2, beacon, numbers, whoShoots, beep, led) {
    lastTimeMessageAt = Date.now();
    setDisconnectedState(false);

    setLightAppearance(light1, beacon);
    setMode(whoShoots);

    const numericTime1 = Number(time1);
    const isFast = isFastState(numericTime1, light1, light2);
    const isExpiryState = isEndFinishedState(time1, light1, time2, light2, numbers, whoShoots);

    if (isExpiryState && !wasInExpiryState) {
      wasInExpiryState = true;
      hasTriedConsumeThisExpiry = false;
    }

    if (!isExpiryState && wasInExpiryState) {
      wasInExpiryState = false;
      hasTriedConsumeThisExpiry = false;

      if (messageState.active) {
        messageState.active = "";
        clearActiveMessage().catch(function () { });
      }
    }

    if (isExpiryState && !messageState.active && !hasTriedConsumeThisExpiry) {

      hasTriedConsumeThisExpiry = true;
      tryConsumePendingMessageIfNeeded();
    }

    if (isFast) {
      showFast();
    } else if (isExpiryState) {
      if (messageState.active) {
        showActiveMessage(messageState.active);
      } else {
        showNextDetail(whoShoots);
      }
    } else {
      showNormalTimer(time1);
    }

    if (time2 && time2 !== 0 && time2 !== time1) {
      secondaryEl.textContent = "ALT: " + time2;
    }
  });
}
