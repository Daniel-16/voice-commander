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
      case "suggest_music":
        const { song, artist } = command.value;
        const searchQuery = `${song} ${artist}`;
        const spotifyUrl = `open.spotify.com/search/${encodeURIComponent(
          searchQuery
        )}`;
        const newTab = await chrome.tabs.create({
          url: `https://${spotifyUrl}`,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
          try {
            const clicked = await chrome.scripting.executeScript({
              target: { tabId: newTab.id },
              func: findAndPlaySpotifyTrack,
              args: [searchQuery],
            });

            if (clicked && clicked[0] && clicked[0].result === true) {
              break;
            }
          } catch (e) {
            console.log("Attempt failed, retrying...", e);
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
        }
        result.success = true;
        break;

      case "open_url":
        let targetUrl = command.value;
        if (
          !targetUrl.startsWith("http://") &&
          !targetUrl.startsWith("https://")
        ) {
          targetUrl = "https://" + targetUrl;
        }

        if (targetUrl.includes("youtube.com/results?search_query=")) {
          const searchQuery = decodeURIComponent(
            targetUrl.split("search_query=")[1]
          );
          const newTab = await chrome.tabs.create({ url: targetUrl });

          await new Promise((resolve) => setTimeout(resolve, 2000));

          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts) {
            try {
              const clicked = await chrome.scripting.executeScript({
                target: { tabId: newTab.id },
                func: findAndPlayVideo,
                args: [searchQuery],
              });

              if (clicked && clicked[0] && clicked[0].result === true) {
                break;
              }
            } catch (e) {
              console.log("Attempt failed, retrying...", e);
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
            attempts++;
          }
        } else if (targetUrl.includes("open.spotify.com/search/")) {
          const searchQuery = decodeURIComponent(
            targetUrl.split("/search/")[1]
          );
          const newTab = await chrome.tabs.create({ url: targetUrl });

          await new Promise((resolve) => setTimeout(resolve, 2000));

          let attempts = 0;
          const maxAttempts = 5;

          while (attempts < maxAttempts) {
            try {
              const clicked = await chrome.scripting.executeScript({
                target: { tabId: newTab.id },
                func: findAndPlaySpotifyTrack,
                args: [searchQuery],
              });

              if (clicked && clicked[0] && clicked[0].result === true) {
                break;
              }
            } catch (e) {
              console.log("Attempt failed, retrying...", e);
            }

            await new Promise((resolve) => setTimeout(resolve, 1000));
            attempts++;
          }
        } else {
          await chrome.tabs.create({ url: targetUrl });
        }
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

function findAndPlayVideo(searchQuery) {
  return new Promise((resolve) => {
    try {
      const checkForVideos = setInterval(() => {
        const videoElements = document.querySelectorAll("a#video-title");

        if (videoElements && videoElements.length > 0) {
          clearInterval(checkForVideos);

          const normalizedQuery = searchQuery
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "");

          const videoTitles = Array.from(videoElements);

          function getMatchScore(title, query) {
            const normalizedTitle = title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "");
            if (normalizedTitle === query) return 100;
            if (normalizedTitle.includes(query)) return 80;

            const queryWords = query.split(" ");
            const matchedWords = queryWords.filter((word) =>
              normalizedTitle.includes(word)
            );
            return (matchedWords.length / queryWords.length) * 60;
          }

          let bestMatch = null;
          let bestScore = 0;

          for (const titleElement of videoTitles) {
            if (
              titleElement.closest(
                "ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-promoted-video-renderer"
              )
            ) {
              continue;
            }

            const visibleTitle = titleElement.textContent?.trim() || "";
            const ariaLabel = titleElement.getAttribute("aria-label") || "";
            const title = visibleTitle || ariaLabel;

            if (!title) continue;

            const score = getMatchScore(title, normalizedQuery);

            if (score > bestScore) {
              bestScore = score;
              bestMatch = titleElement;
            }

            if (score === 100) break;
          }

          if (bestMatch) {
            bestMatch.scrollIntoView({ behavior: "smooth", block: "center" });

            setTimeout(() => {
              console.log(
                "Alris: Playing video -",
                bestMatch.textContent?.trim()
              );
              bestMatch.click();
              resolve(true);
            }, 1000);
          } else {
            console.log(
              "Alris: No matching video found, clicking first available video"
            );
            const firstVideo = videoTitles.find(
              (el) =>
                !el.closest(
                  "ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-promoted-video-renderer"
                )
            );
            if (firstVideo) {
              firstVideo.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              setTimeout(() => {
                firstVideo.click();
                resolve(true);
              }, 1000);
            } else {
              console.error(
                "Alris: Could not find any suitable videos to play"
              );
              resolve(false);
            }
          }
        }
      }, 500);

      setTimeout(() => {
        clearInterval(checkForVideos);
        console.error("Alris: Timeout waiting for video elements");
        resolve(false);
      }, 10000);
    } catch (e) {
      console.error("Alris: Error auto-playing video:", e);
      resolve(false);
    }
  });
}

function findAndPlaySpotifyTrack(searchQuery) {
  return new Promise((resolve) => {
    try {
      const checkForTracks = setInterval(() => {
        const trackElements = document.querySelectorAll(
          [
            'a[href^="/track/"]',
            "a.btE2c3IKaOXZ4VNAb8WQ",
            'div[role="row"]',
          ].join(",")
        );

        if (trackElements && trackElements.length > 0) {
          clearInterval(checkForTracks);

          const normalizedQuery = searchQuery
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "");

          function getMatchScore(title, query) {
            const normalizedTitle = title
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, "");
            if (normalizedTitle === query) return 100;
            if (normalizedTitle.includes(query)) return 80;

            const queryWords = query.split(" ");
            const matchedWords = queryWords.filter((word) =>
              normalizedTitle.includes(word)
            );
            return (matchedWords.length / queryWords.length) * 60;
          }

          let bestMatch = null;
          let bestScore = 0;

          for (const element of trackElements) {
            const titleElement =
              element.querySelector('[data-encore-id="text"]') ||
              element.querySelector('[dir="auto"]') ||
              element;

            if (!titleElement) continue;

            const title = titleElement.textContent?.trim() || "";
            if (!title) continue;

            const score = getMatchScore(title, normalizedQuery);

            if (score > bestScore) {
              bestScore = score;
              bestMatch = element;
            }

            if (score === 100) break;
          }

          if (bestMatch) {
            bestMatch.scrollIntoView({ behavior: "smooth", block: "center" });

            setTimeout(() => {
              let playButton = null;

              playButton = bestMatch.querySelector(
                'button[data-testid="play-button"]'
              );

              if (!playButton && bestMatch.closest('div[role="row"]')) {
                playButton = bestMatch
                  .closest('div[role="row"]')
                  .querySelector('button[data-testid="play-button"]');
              }

              if (!playButton) {
                const row =
                  bestMatch.closest('div[role="row"]') ||
                  bestMatch.parentElement;
                if (row) {
                  const siblings = Array.from(row.children);
                  for (const sibling of siblings) {
                    const btn = sibling.querySelector(
                      'button[data-testid="play-button"]'
                    );
                    if (btn) {
                      playButton = btn;
                      break;
                    }
                  }
                }
              }

              if (playButton) {
                console.log(
                  "Alris: Playing Spotify track -",
                  bestMatch.textContent?.trim()
                );
                playButton.click();
                resolve(true);
              } else {
                console.log(
                  "Alris: Play button not found, trying to click the track"
                );
                bestMatch.click();

                setTimeout(() => {
                  const mainPlayButton = document.querySelector(
                    'button[data-testid="play-button"]'
                  );
                  if (mainPlayButton) {
                    mainPlayButton.click();
                    resolve(true);
                  } else {
                    console.error("Alris: Could not find any play button");
                    resolve(false);
                  }
                }, 2000);
              }
            }, 1500);
          } else {
            console.log(
              "Alris: No matching track found, trying first available track"
            );
            const firstTrack = trackElements[0];
            if (firstTrack) {
              firstTrack.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
              setTimeout(() => {
                const playButton =
                  firstTrack.querySelector(
                    'button[data-testid="play-button"]'
                  ) ||
                  firstTrack
                    .closest('div[role="row"]')
                    ?.querySelector('button[data-testid="play-button"]');
                if (playButton) {
                  playButton.click();
                  resolve(true);
                } else {
                  firstTrack.click();
                  setTimeout(() => {
                    const mainPlayButton = document.querySelector(
                      'button[data-testid="play-button"]'
                    );
                    if (mainPlayButton) {
                      mainPlayButton.click();
                      resolve(true);
                    } else {
                      console.error(
                        "Alris: Play button not found for the first track"
                      );
                      resolve(false);
                    }
                  }, 2000);
                }
              }, 1500);
            } else {
              console.error("Alris: Could not find any tracks to play");
              resolve(false);
            }
          }
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkForTracks);
        console.error("Alris: Timeout waiting for Spotify tracks");
        resolve(false);
      }, 15000);
    } catch (e) {
      console.error("Alris: Error auto-playing Spotify track:", e);
      resolve(false);
    }
  });
}
