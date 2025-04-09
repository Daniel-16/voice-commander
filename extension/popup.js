const statusElement = document.getElementById("status");
const reconnectBtn = document.getElementById("reconnectBtn");
let lastStatus = "";

function updateStatus(text) {
  if (text === lastStatus) return; // Prevent unnecessary DOM updates
  lastStatus = text;
  statusElement.textContent = text;

  // Update visual indication
  statusElement.className = text.toLowerCase().includes("connected")
    ? "status-connected"
    : text.toLowerCase().includes("error")
    ? "status-error"
    : "status-disconnected";
}

// Get initial status
chrome.runtime
  .sendMessage({ type: "getStatus" })
  .then((response) => {
    updateStatus(response.status || "Unknown");
  })
  .catch((err) => {
    console.error("Error getting status:", err);
    updateStatus("Error loading status");
  });

// Listen for status updates from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "statusUpdate") {
    updateStatus(message.status);
  }
});

// Handle reconnect button with debounce
let reconnectTimeout = null;
reconnectBtn.addEventListener("click", () => {
  if (reconnectTimeout) return; // Prevent spam clicking

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

  // Prevent multiple reconnect attempts
  reconnectTimeout = setTimeout(() => {
    reconnectBtn.disabled = false;
    reconnectTimeout = null;
  }, 5000);
});
