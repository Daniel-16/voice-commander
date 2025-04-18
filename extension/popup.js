const statusElement = document.getElementById("status");
const reconnectBtn = document.getElementById("reconnectBtn");
let lastStatus = "";

function updateStatus(text) {
  if (text === lastStatus) return;
  lastStatus = text;
  statusElement.textContent = text;
  
  statusElement.className = text.toLowerCase().includes("connected")
    ? "status-connected"
    : text.toLowerCase().includes("error")
    ? "status-error"
    : "status-disconnected";
}

chrome.runtime
  .sendMessage({ type: "getStatus" })
  .then((response) => {
    updateStatus(response.status || "Unknown");
  })
  .catch((err) => {
    console.error("Error getting status:", err);
    updateStatus("Error loading status");
  });

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "statusUpdate") {
    updateStatus(message.status);
  }
});

let reconnectTimeout = null;
reconnectBtn.addEventListener("click", () => {
  if (reconnectTimeout) return;

  updateStatus("Attempting reconnect...");
  reconnectBtn.disabled = true;

  chrome.runtime
    .sendMessage({ type: "reconnect" })
    .then((response) => {
      updateStatus(response.status || "Reconnecting...");
    })
    .catch((err) => {
      console.error("Error sending reconnect message:", err);
      updateStatus("Error reconnecting");
    });

  reconnectTimeout = setTimeout(() => {
    reconnectBtn.disabled = false;
    reconnectTimeout = null;
  }, 5000);
});
