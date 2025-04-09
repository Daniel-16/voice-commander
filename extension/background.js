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
