/** JavaScript for messages.html.
 *  @author: Philip Taylor
 *  @editor: Jesse Phillips
 *  @version: 0.0.1
 **/

const inputEl = document.getElementById("messageInput");
const charCountEl = document.getElementById("charCount");
const queueBtnEl = document.getElementById("queueBtn");
const clearPendingBtnEl = document.getElementById("clearPendingBtn");
const clearActiveBtnEl = document.getElementById("clearActiveBtn");
const statusEl = document.getElementById("status");
const pendingValueEl = document.getElementById("pendingValue");
const activeValueEl = document.getElementById("activeValue");

function normalizeMessage(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, 40);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function renderState(state) {
  const pending = normalizeMessage(state.pending || "");
  const active = normalizeMessage(state.active || "");

  if (pending) {
    pendingValueEl.textContent = pending;
    pendingValueEl.classList.remove("state-empty");
  } else {
    pendingValueEl.textContent = "None";
    pendingValueEl.classList.add("state-empty");
  }

  if (active) {
    activeValueEl.textContent = active;
    activeValueEl.classList.remove("state-empty");
  } else {
    activeValueEl.textContent = "None";
    activeValueEl.classList.add("state-empty");
  }
}

function updateCharCount() {
  const length = inputEl.value.length;
  charCountEl.textContent = `${length} / 40`;

  if (length >= 35) {
    charCountEl.classList.add("warn");
  } else {
    charCountEl.classList.remove("warn");
  }
}

function fetchState() {
  return fetch("/api/message-state", {
    method: "GET",
    headers: { "Accept": "application/json" }
  }).then(r => r.json());
}

function setPendingMessage(message) {
  return fetch("/api/message-state/pending", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ message })
  }).then(r => r.json());
}

function clearPendingMessage() {
  return fetch("/api/message-state/clear-pending", {
    method: "POST",
    headers: { "Accept": "application/json" }
  }).then(r => r.json());
}

function clearActiveMessage() {
  return fetch("/api/message-state/clear-active", {
    method: "POST",
    headers: { "Accept": "application/json" }
  }).then(r => r.json());
}

queueBtnEl.addEventListener("click", function () {
  const message = normalizeMessage(inputEl.value);

  if (!message) {
    setStatus("Enter a message first.");
    inputEl.focus();
    return;
  }

  setStatus("Queueing message...");

  setPendingMessage(message)
    .then(state => {
      renderState(state);
      setStatus("Message queued.");
      inputEl.value = "";
      updateCharCount();
      inputEl.focus();
    })
    .catch(() => {
      setStatus("Could not queue message.");
    });
});

clearPendingBtnEl.addEventListener("click", function () {
  setStatus("Clearing queued message...");

  clearPendingMessage()
    .then(state => {
      renderState(state);
      setStatus("Queued message cleared.");
      inputEl.focus();
    })
    .catch(() => {
      setStatus("Could not clear queued message.");
    });
});

clearActiveBtnEl.addEventListener("click", function () {
  setStatus("Clearing active message...");

  clearActiveMessage()
    .then(state => {
      renderState(state);
      setStatus("Active message cleared.");
      inputEl.focus();
    })
    .catch(() => {
      setStatus("Could not clear active message.");
    });
});

document.querySelectorAll(".preset").forEach(function (button) {
  button.addEventListener("click", function () {
    inputEl.value = button.dataset.message || "";
    updateCharCount();
    inputEl.focus();
  });
});

inputEl.addEventListener("input", updateCharCount);

// Refresh state regularly so the page stays in sync with the display.
setInterval(function () {
  fetchState()
    .then(renderState)
    .catch(() => { });
}, 2000);

fetchState()
  .then(state => {
    renderState(state);
    updateCharCount();
    inputEl.focus();
  })
  .catch(() => {
    setStatus("Could not load message state.");
  });