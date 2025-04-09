const statusElement = document.getElementById("status");
const reconnectBtn = document.getElementById("reconnectBtn");

function updateStatus(text) {
  statusElement.textContent = text;
}

chrome.runtime
  .sendMessage({ type: "getStatus" })
  .then((response) => {
    updateStatus(response.status || "Unknown");
  })
  .catch((err) => {
    updateStatus("Error loading status");
    console.error("Error getting status:", err);
  });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "statusUpdate") {
    updateStatus(message.status);
  }
});

reconnectBtn.addEventListener("click", () => {
  updateStatus("Attempting reconnect...");
  chrome.runtime
    .sendMessage({ type: "reconnect" })
    .then((response) => {
      updateStatus(response.status || "Reconnecting...");
    })
    .catch((err) => {
      updateStatus("Error reconnecting");
      console.error("Error sending reconnect message:", err);
    });
});
