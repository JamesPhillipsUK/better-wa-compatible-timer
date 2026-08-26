/** JavaScript for led-display.html.
 *  @author: Philip Taylor
 *  @editor: Jesse Phillips
 *  @version: 1.1.0
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

const DETAIL_LABELS = {
  5: { upper: "AB", lower: "ab" },
  6: { upper: "CD", lower: "cd" },
  11: { upper: "AB", lower: "ab" },
  12: { upper: "CD", lower: "cd" },
  13: { upper: "EF", lower: "ef" },
};

const TWO_DETAIL_CYCLE = [5, 6];
const THREE_DETAIL_CYCLE = [11, 12, 13];

let shootingOrderState = {
  detailCount: 0,
  endStart: null,
  current: null,
  lastLoaded: null,
  hasStarted: false
};

let wasInDetailLoadedState = false;

const SHOOTING_ORDER_STORAGE_KEY = "waShootingOrderState";

function saveShootingOrderState() {
  try {
    sessionStorage.setItem(
      SHOOTING_ORDER_STORAGE_KEY,
      JSON.stringify({
        shootingOrderState: shootingOrderState,
        wasInDetailLoadedState: wasInDetailLoadedState
      })
    );
  } catch (e) {
    console.warn("Could not save shooting-order state", e);
  }
}

function restoreShootingOrderState() {
  try {
    const saved = sessionStorage.getItem(SHOOTING_ORDER_STORAGE_KEY);

    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);

    if (parsed.shootingOrderState) {
      shootingOrderState = parsed.shootingOrderState;
    }

    if (typeof parsed.wasInDetailLoadedState === "boolean") {
      wasInDetailLoadedState = parsed.wasInDetailLoadedState;
    }
  } catch (e) {
    console.warn("Could not restore shooting-order state", e);
  }
}

restoreShootingOrderState();

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

function tryConsumePendingMessageIfNeeded(whoShoots) {

  if (!wasInExpiryState || isConsumingMessage) {
    return;
  }

  isConsumingMessage = true;

  consumePendingMessage()
    .then(function () {

      if (wasInExpiryState && messageState.active) {
        showActiveMessage(messageState.active);
      } else if (wasInExpiryState && whoShoots !== undefined) {
        showNextPhase(whoShoots);
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

  function getDetailCycle(whoShoots) {
  const ws = Number(whoShoots);

  if (ws === 5 || ws === 6) {
    return TWO_DETAIL_CYCLE;
  }

  if (ws === 11 || ws === 12 || ws === 13) {
    return THREE_DETAIL_CYCLE;
  }

  return null;
}

function getNextInCycle(value, cycle) {
  const index = cycle.indexOf(Number(value));
  if (index === -1) return null;
  return cycle[(index + 1) % cycle.length];
}

function getPreviousInCycle(value, cycle) {
  const index = cycle.indexOf(Number(value));
  if (index === -1) return null;
  return cycle[(index - 1 + cycle.length) % cycle.length];
}

function getRotatedCycle(cycle, startValue) {
  const index = cycle.indexOf(Number(startValue));
  if (index === -1) return cycle.slice();
  return cycle.slice(index).concat(cycle.slice(0, index));
}

function resyncShootingOrderToCurrentDetail() {
  const ws = Number(shootingOrderState.current);
  const cycle = getDetailCycle(ws);

  if (!cycle) {
    return;
  }

  shootingOrderState.detailCount = cycle.length;
  shootingOrderState.endStart = ws;
  shootingOrderState.current = ws;
  shootingOrderState.lastLoaded = ws;
  shootingOrderState.hasStarted = false;

  wasInDetailLoadedState = false;

  saveShootingOrderState();

  setMode(ws);

  console.log("Shooting order manually resynchronised to", ws);
}

function isDetailLoadedState(time1, light1, light2, whoShoots) {
  return Number(time1) === 10 &&
    Number(light1) === 1 &&
    Number(light2) === 1 &&
    getDetailCycle(whoShoots) !== null;
}

function observeShootingOrder(time1, light1, light2, whoShoots) {
  const ws = Number(whoShoots);
  const cycle = getDetailCycle(ws);
  const isLoaded = isDetailLoadedState(time1, light1, light2, ws);
  const isShooting =
  Number(time1) > 0 &&
  (Number(light1) === 2 || Number(light1) === 3);

  if (!cycle) {
    wasInDetailLoadedState = isLoaded;
    return;
  }

  const modeChanged = shootingOrderState.detailCount !== cycle.length;
  const isUninitialised = shootingOrderState.endStart === null;

  if (modeChanged || isUninitialised) {
  shootingOrderState.detailCount = cycle.length;
  shootingOrderState.endStart = ws;
  shootingOrderState.current = ws;
  shootingOrderState.lastLoaded = ws;
  shootingOrderState.hasStarted = isShooting;
  } else {
  shootingOrderState.current = ws;
  }

  if (
    isLoaded &&
    !shootingOrderState.hasStarted &&
    shootingOrderState.lastLoaded !== ws
  ) {
    shootingOrderState.endStart = ws;
    shootingOrderState.current = ws;
    shootingOrderState.lastLoaded = ws;
  }

  if (isLoaded && !wasInDetailLoadedState) {
    const previous = shootingOrderState.lastLoaded;

    if (!modeChanged && !isUninitialised && previous !== null) {
      let isNewEnd = false;

      if (cycle.length === 2) {
        isNewEnd = previous === ws;
      } else {
        isNewEnd = ws === getPreviousInCycle(previous, cycle);
      }

      if (isNewEnd) {
        shootingOrderState.endStart = ws;
        shootingOrderState.hasStarted = false;
      } else {
        const expectedNext = getNextInCycle(previous, cycle);

        if (cycle.length === 3 && ws !== previous && ws !== expectedNext) {
          shootingOrderState.endStart = ws;
        }
      }
    }

    shootingOrderState.lastLoaded = ws;
  }

  if (isShooting) {
  shootingOrderState.hasStarted = true;
  }

  wasInDetailLoadedState = isLoaded;

  if (isShooting) {
  shootingOrderState.hasStarted = true;
  }

  wasInDetailLoadedState = isLoaded;
  saveShootingOrderState();
}

function formatShootingOrder(order, activeWhoShoots) {
  const active = Number(activeWhoShoots);

  return order.map(function (ws) {
    const labels = DETAIL_LABELS[ws];
    return ws === active ? labels.upper : labels.lower;
  }).join(" ");
}

function formatCollectingOrder(order) {
  return order.map(function (ws) {
    return DETAIL_LABELS[ws].upper;
  }).join(" ");
}

function getCurrentShootingOrderLabel(whoShoots) {
  const ws = Number(whoShoots);
  const cycle = getDetailCycle(ws);

  if (!cycle) return "";

  const start = shootingOrderState.endStart !== null
    ? shootingOrderState.endStart
    : ws;

  const order = getRotatedCycle(cycle, start);
  return formatShootingOrder(order, ws);
}

function getExpiryDisplay(whoShoots) {
  const ws = Number(whoShoots);
  const cycle = getDetailCycle(ws);

  if (!cycle || shootingOrderState.endStart === null) {
    return null;
  }

  const order = getRotatedCycle(cycle, shootingOrderState.endStart);
  const currentIndex = order.indexOf(ws);

  if (currentIndex === -1) {
    return null;
  }

  if (currentIndex < order.length - 1) {
    const nextDetail = order[currentIndex + 1];

    return {
      title: "NEXT DETAIL",
      label: formatShootingOrder(order, nextDetail)
    };
  }

  const nextEndStart = getNextInCycle(shootingOrderState.endStart, cycle);
  const nextEndOrder = getRotatedCycle(cycle, nextEndStart);

  return {
    title: "NEXT END",
    label: formatCollectingOrder(nextEndOrder)
  };
}

function showNextPhase(whoShoots) {
  const display = getExpiryDisplay(whoShoots);

  topLabelEl.textContent = "";
  topLabelEl.style.display = "none";
  timerEl.classList.remove("message-display", "fast-display", "detail-display");
  timerEl.style.fontSize = "";
  timerEl.textContent = "";
  bottomLabelEl.textContent = "";
  secondaryEl.textContent = "";

  if (!display) {
    return;
  }

  topLabelEl.textContent = display.title;
  topLabelEl.style.display = "block";
  timerEl.classList.add("detail-display");

  // The full Danage-style order is wider than the old two-letter display.
  timerEl.style.fontSize = shootingOrderState.detailCount === 3
    ? "min(18vw, 46vh)"
    : "min(24vw, 50vh)";

  timerEl.textContent = display.label;
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
    wasInDetailLoadedState = false;
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
      bottomLabelEl.textContent = getCurrentShootingOrderLabel(whoShoots);
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

  // Exception: the normal red 10-second detail-loaded state is not FAST.
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

document.addEventListener("keydown", function (event) {
  if (event.key.toLowerCase() === "r") {
    resyncShootingOrderToCurrentDetail();
  }
});

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
    observeShootingOrder(time1, light1, light2, whoShoots);
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
      tryConsumePendingMessageIfNeeded(whoShoots);
    }

    if (isFast) {
      showFast();
    } else if (isExpiryState) {
      if (messageState.active) {
        showActiveMessage(messageState.active);
      } else if (isConsumingMessage) {
        // Wait for message check to finish before showing next transition.
      } else {
        showNextPhase(whoShoots);
      }
    } else {
      showNormalTimer(time1);
    }

    if (time2 && time2 !== 0 && time2 !== time1) {
      secondaryEl.textContent = "ALT: " + time2;
    }
  });
}
