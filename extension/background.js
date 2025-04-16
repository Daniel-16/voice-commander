const WS_URL = "ws://localhost:8080/extension";
let socket = null;
let reconnectInterval = 5000;
let isRegistered = false;

function connect() {
  console.log("Attempting to connect to WebSocket:", WS_URL);
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("WebSocket connected");
    registerExtension();
  };

  socket.onmessage = async (event) => {
    console.log("Message received from server:", event.data);
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse message:", error);
      return;
    }

    if (data.type === "message" && data.payload === "Registration successful") {
      isRegistered = true;
      updatePopupStatus("Connected and Registered");
      console.log("Extension successfully registered with server");
    } else if (data.type === "command" && data.payload) {
      if (!isRegistered) {
        console.warn(
          "Received command but not registered, attempting registration"
        );
        registerExtension();
        return;
      }
      await executeCommand(data.payload);
    }
  };

  socket.onclose = (event) => {
    console.log("WebSocket disconnected. Reason:", event.code, event.reason);
    updatePopupStatus(`Disconnected (Code: ${event.code})`);
    socket = null;
    isRegistered = false;
    setTimeout(connect, reconnectInterval);
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    updatePopupStatus("Error");
    isRegistered = false;
    socket = null;
  };
}

function registerExtension() {
  safeSend({
    type: "register",
    payload: {
      client: "extension",
      version: chrome.runtime.getManifest().version,
    },
  });
}

function safeSend(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify(data));
      console.log("Sent message:", data);
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  } else {
    console.warn("Cannot send message, WebSocket not open.");
    return false;
  }
}

async function executeCommand(command) {
  console.log("Executing command:", command);
  let result = { success: false, error: null };
  try {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!currentTab) {
      throw new Error("No active tab found.");
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

      case "play_video":
        const searchTerm = command.value;
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
          searchTerm
        )}`;
        const newTab = await chrome.tabs.create({ url: searchUrl });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        await chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          func: autoPlayFirstVideo,
        });
        result.success = true;
        break;

      case "click":
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: domClick,
          args: [command.value],
        });
        result.success = true;
        break;

      case "scroll":
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
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
            target: { tabId: tabId },
            func: domType,
            args: [command.value.selector, command.value.text],
          });
          result.success = true;
        } else {
          throw new Error("Invalid 'type' command value format.");
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
            throw new Error(`Unsupported navigation action: ${command.value}`);
        }
        break;

      case "close_tab":
        await chrome.tabs.remove(tabId);
        result.success = true;
        break;

      default:
        throw new Error(`Unsupported command action: ${command.action}`);
    }
    safeSend({ type: "execution_confirmation", payload: command });
  } catch (error) {
    console.error("Error executing command:", command, error);
    result.error = error.message;
    safeSend({
      type: "execution_error",
      payload: { command: command, error: error.message },
    });
  }
  console.log("Execution result:", result);
}

function domClick(selector) {
  try {
    const element = document.querySelector(selector);
    if (element) {
      element.click();
    } else {
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
        console.error(`Alris: Element not found for selector "${selector}"`);
      }
    }
  } catch (e) {
    console.error(`Alris: Error clicking selector "${selector}":`, e);
  }
}

function domScroll(pixels) {
  if (pixels === 0) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (pixels > 5000) {
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
      element.focus();
      element.value = text;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      element.blur();
    } else {
      console.error(
        `Alris: Element not found or not typable for selector "${selector}"`
      );
    }
  } catch (e) {
    console.error(`Alris: Error typing in selector "${selector}":`, e);
  }
}

function updatePopupStatus(statusText) {
  chrome.runtime
    .sendMessage({ type: "statusUpdate", status: statusText })
    .catch((err) => {
      if (
        err.message !==
        "Could not establish connection. Receiving end does not exist."
      ) {
        console.warn("Could not send status to popup:", err.message);
      }
    });
}

connect();

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

function autoPlayFirstVideo() {
  try {
    const videoLink = document.querySelector(
      "#contents ytd-video-renderer a#thumbnail"
    );
    if (videoLink) {
      videoLink.click();
      return;
    }
    
    const firstVideo = document.querySelector("ytd-video-renderer");
    if (firstVideo) {
      const link = firstVideo.querySelector("a#thumbnail");
      if (link) {
        link.click();
        return;
      }
    }

    console.error("Alris: Could not find video to play");
  } catch (e) {
    console.error("Alris: Error auto-playing video:", e);
  }
}
