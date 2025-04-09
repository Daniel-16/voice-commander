const WS_URL = "ws://localhost:8080/extension";
let socket = null;
let reconnectInterval = 5000;

function connect() {
  console.log("Attempting to connect to WebSocket server...", WS_URL);
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("Connected to WebSocket server");
    updatePopupStatus("Connected");
  };

  socket.onmessage = async (event) => {
    console.log("Message received from server:", event.data);
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse message", error);
      return;
    }

    if (data.type === "command" && data.payload) {
      await executeCommand(data.payload);
    }
  };

  socket.onclose = (event) => {
    console.log("Websocket disconnected. Reason: ", event.code, event.reason);
    updatePopupStatus(`Disconnected (Code: ${event.code})`);
    socket = null;
    setTimeout(connect, reconnectInterval);
  };

  socket.onerror = (error) => {
    console.error("Websocket error: ", error);
    updatePopupStatus(error);
    socket = null;
  };
}

function safeSend(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(data));
      console.log("Sent message: ", data);
      return true;
    } catch (error) {
      console.error("Error sending message", error);
      return false;
    }
  } else {
    console.warn("Cannot send message, WebSocket not open");
    return false;
  }
}

async function executeCommand(command) {
  console.log("Executing command", command);
  let result = { success: false, error: null };
  try {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!currentTab) {
      throw new Error("No active tabs found.");
    }
    const tabId = currentTab.id;

    switch (command.action) {
      case "open_url":
        let url = command.value;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = "https://" + url;
        }
        await chrome.tabs.create({ url: url });
        result.success = true;
        break;
      case "click":
        await chrome.scripting.executeScript({
          target: { tabId },
          func: domClick,
          args: [command.value],
        });
        result.success = true;
        break;
      case "scroll":
        await chrome.scripting.executeScript({
          target: { tabId },
          func: domScroll,
          args: [command.value],
        });
        result.success = true;
        break;
      case "type":
        if (
          typeof command.value === "object" &&
          command.value.selector &&
          command.value.text
        ) {
          await chrome.scripting.executeScript({
            target: { tabId },
            func: domType,
            args: [command.value.selector, command.value.text],
          });
          result.success = true;
        } else {
          throw new Error("Invalid command value for 'type'");
        }
        break;
      case "navigate":
        switch (command.value) {
          case "back":
            await chrome.tabs.goBack(tabId);
            result.success = true;
            break;
          case "forward":
            await chrome.tabs.goForward(tabId);
            result.success = true;
            break;
          case "refresh":
            await chrome.tabs.reload(tabId);
            result.success = true;
            break;
          default:
            throw new Error("Invalid command value for 'navigate'");
        }
        break;
      case "close_tab":
        await chrome.tabs.remove(tabId);
        result.success = true;
        break;
      default:
        throw new Error("Unknown command action", command.action);
    }
    safeSend({
      type: "execution_confirmation",
      payload: {
        command,
      },
    });
  } catch (error) {
    console.error("Error executing command", error);
    result.error = error.message;
    safeSend({
      type: "execution_error",
      payload: {
        command,
        error: error.message,
      },
    });
    console.log("Error result", result);
  }
}

function domClick(selector) {
  try {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
    } else {
      // Try finding by text content as a fallback for simple cases
      const elements = Array.from(
        document.querySelectorAll(
          'button, a, input[type="button"], input[type="submit"]'
        )
      );
      const textMatch = elements.find(
        (el) =>
          el.textContent
            .trim()
            .toLowerCase()
            .includes(selector.toLowerCase()) ||
          el.value?.trim().toLowerCase().includes(selector.toLowerCase()) ||
          el
            .getAttribute("aria-label")
            ?.toLowerCase()
            .includes(selector.toLowerCase())
      );
      if (textMatch) {
        textMatch.click();
      } else {
        console.error(
          `Voice Commander: Element not found for selector "${selector}"`
        );
        // Cannot easily send error back from injected script without complex messaging
        // throw new Error(`Element not found: ${selector}`); // This error won't reach background.js easily
      }
    }
  } catch (e) {
    console.error(`Voice Commander: Error clicking selector "${selector}":`, e);
  }
}

function domScroll(pixels) {
  if (pixels === 0) {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (pixels > 5000) {
    // Scroll to bottom heuristic
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  } else {
    window.scrollBy({ top: pixels, behavior: "smooth" });
  }
}

function domType(selector, text) {
  try {
    const element = document.querySelector(selector);
    if (
      element &&
      (element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.isContentEditable)
    ) {
      // Focus, clear existing (optional), type, and blur
      element.focus();
      // element.value = ''; // Optional: clear before typing
      // Simulate typing character by character might trigger more events if needed
      element.value = text;
      // Dispatch input/change events to potentially trigger framework updates
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.blur();
    } else {
      console.error(
        `Voice Commander: Element not found or not typable for selector "${selector}"`
      );
    }
  } catch (e) {
    console.error(
      `Voice Commander: Error typing in selector "${selector}":`,
      e
    );
  }
}
// --- End DOM Functions ---

// Function to update popup status (if popup is open)
function updatePopupStatus(statusText) {
  chrome.runtime
    .sendMessage({ type: "statusUpdate", status: statusText })
    .catch((err) => {
      // Ignore error if popup is not open / listening
      if (
        err.message !==
        "Could not establish connection. Receiving end does not exist."
      ) {
        console.warn("Could not send status to popup:", err.message);
      }
    });
}

// Initial connection attempt
connect();

// Optional: Keep service worker alive mechanism (use alarms if needed for longer tasks)
chrome.alarms.create('keepAlive', { periodInMinutes: 4.8 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'keepAlive') {
    console.log('Keep alive alarm fired');
    // You might check connection status here or perform a no-op
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getStatus") {
    const currentStatus =
      socket && socket.readyState === WebSocket.OPEN
        ? "Connected"
        : "Disconnected";
    sendResponse({ status: currentStatus });
    return true;
  }
  if (message.type === "reconnect") {
    console.log("Reconnect requested from popup");
    if (socket) {
      socket.close();
    } else {
      connect();
    }
    sendResponse({ status: "Reconnecting..." });
    return true;
  }
});
