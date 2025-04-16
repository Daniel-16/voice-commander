import "dotenv/config.js";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { browserControlPrompt } from "./config/prompt.js";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("GOOGLE_API_KEY is not set in the environment variables.");
  process.exit(1);
}

const genAi = new GoogleGenerativeAI(API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });

const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

const clients = new Set();
const extensions = new Set();
const registeredExtensions = new Set();

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log("Client connection dead - terminating");
      clients.delete(ws);
      extensions.delete(ws);
      registeredExtensions.delete(ws);
      return ws.terminate();
    }

    ws.isAlive = false;
    ws.ping();
  });
}, 15000);

wss.on("close", () => {
  clearInterval(interval);
});

wss.on("error", (error) => {
  console.error("WebSocket Server Error:", error);
});

wss.on("connection", (ws, req) => {
  console.log("Client connected from:", req.socket.remoteAddress);
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  clients.add(ws);
  const clientType = req.url === "/extension" ? "extension" : "webapp";

  if (clientType === "extension") {
    extensions.add(ws);
    console.log("Browser extension connected - awaiting registration");
    safeSend(
      ws,
      JSON.stringify({
        type: "message",
        payload: "Extension connected - awaiting registration",
      })
    );
  } else {
    console.log("Web interface connected");
    safeSend(
      ws,
      JSON.stringify({ type: "message", payload: "Web interface connected" })
    );
    if (registeredExtensions.size > 0) {
      safeSend(
        ws,
        JSON.stringify({
          type: "message",
          payload: "Browser extension is active",
        })
      );
    } else {
      safeSend(
        ws,
        JSON.stringify({
          type: "message",
          payload:
            "No browser extension detected. Please install and enable the extension.",
        })
      );
    }
    setTimeout(() => {
      safeSend(ws, JSON.stringify({ type: "message", payload: "Ready" }));
    }, 1500);
  }

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "voice_command") {
        const response = await processVoiceCommand(data);
        safeSend(ws, JSON.stringify(response));
      } else {
        console.log("Received message:", message.toString());
        let data;
        try {
          data = JSON.parse(message.toString());

          if (
            data.type === "register" &&
            data.payload?.client === "extension"
          ) {
            console.log("Extension registered:", data.payload);
            registeredExtensions.add(ws);
            safeSend(
              ws,
              JSON.stringify({
                type: "message",
                payload: "Registration successful",
              })
            );
            return;
          }

          if (data.type === "ping") {
            ws.isAlive = true;
            safeSend(ws, JSON.stringify({ type: "pong" }));
            return;
          }

          if (data.type === "voice_command" && data.payload) {
            const userText = data.payload;
            console.log(`Processing user command: ${userText}`);

            broadcastToWebApps(
              JSON.stringify({ type: "message", payload: "Processing" })
            );

            try {
              const commandJson = await getCommandFromLLM(userText);
              console.log(`LLM JSON: ${JSON.stringify(commandJson)}`);

              if (commandJson && Object.keys(commandJson).length > 0) {
                console.log("Broadcasting command to extensions:", commandJson);

                if (registeredExtensions.size === 0) {
                  broadcastToWebApps(
                    JSON.stringify({
                      type: "error",
                      payload:
                        "No browser extension connected. Please install and enable the extension.",
                    })
                  );
                  return;
                }

                broadcastToRegisteredExtensions(
                  JSON.stringify({
                    type: "command",
                    payload: commandJson,
                  })
                );

                broadcastToWebApps(
                  JSON.stringify({
                    type: "message",
                    payload: "Command sent to extension",
                  })
                );
              } else {
                console.log("Unsupported or ambiguous command");
                broadcastToWebApps(
                  JSON.stringify({
                    type: "error",
                    payload:
                      "Unsupported or ambiguous command. Please try rephrasing.",
                  })
                );
              }
            } catch (error) {
              console.error("Error processing command:", error);
              broadcastToWebApps(
                JSON.stringify({
                  type: "error",
                  payload: "Error processing command: " + error.message,
                })
              );
            }
          } else if (data.type === "execution_confirmation") {
            console.log("Execution confirmation received:", data.payload);
            broadcastToWebApps(
              JSON.stringify({
                type: "message",
                payload: "Execution confirmed",
              })
            );
            setTimeout(() => {
              broadcastToWebApps(
                JSON.stringify({ type: "message", payload: "Ready" })
              );
            }, 1500);
          } else if (data.type === "execution_error") {
            console.error("Execution error from extension:", data.payload);
            broadcastToWebApps(
              JSON.stringify({
                type: "error",
                payload: `Extension error: ${data.payload.error}`,
              })
            );
            setTimeout(() => {
              broadcastToWebApps(
                JSON.stringify({ type: "message", payload: "Ready" })
              );
            }, 2000);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
          safeSend(
            ws,
            JSON.stringify({ type: "error", payload: "Invalid message format" })
          );
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      safeSend(
        ws,
        JSON.stringify({
          type: "error",
          payload: "Failed to process command",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
    extensions.delete(ws);
    registeredExtensions.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
    extensions.delete(ws);
    registeredExtensions.delete(ws);
  });
});

async function getCommandFromLLM(userInput) {
  const prompt = `
    ${browserControlPrompt}
    Input: ${userInput}
    Output:
  `;
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    const jsonString = text.replace(/^```json\s*|```$/g, "").trim();
    const parsedJson = JSON.parse(jsonString);

    if (typeof parsedJson === "object" && parsedJson !== null) {
      if (Object.keys(parsedJson).length === 0) return {};
      if (parsedJson.action && typeof parsedJson.action === "string") {
        return parsedJson;
      }
    }
    console.warn("LLM output is not a valid JSON object:", text);
    return {};
  } catch (error) {
    console.error("Error parsing JSON from LLM output:", error);
    throw new Error("LLM API call failed");
  }
}

async function processVoiceCommand(data) {
  if (typeof data.payload === "string") {
    console.log(`Processing voice command text: ${data.payload}`);
    try {
      const commandJson = await getCommandFromLLM(data.payload);

      if (commandJson && Object.keys(commandJson).length > 0) {
        if (registeredExtensions.size === 0) {
          return {
            type: "error",
            payload:
              "No browser extension connected. Please install and enable the extension.",
          };
        }

        broadcastToRegisteredExtensions(
          JSON.stringify({
            type: "command",
            payload: commandJson,
          })
        );

        return {
          type: "message",
          payload: `Recognized: "${data.payload}". Executing command...`,
        };
      } else {
        return {
          type: "error",
          payload: "Unsupported or ambiguous command. Please try again.",
        };
      }
    } catch (error) {
      console.error("Error processing command:", error);
      return {
        type: "error",
        payload: "Failed to process command",
      };
    }
  }

  return {
    type: "error",
    payload: "Invalid command format",
  };
}

function safeSend(client, message) {
  try {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  } catch (error) {
    console.error("Error sending message to client:", error);
  }
}

function broadcast(message) {
  clients.forEach((client) => {
    safeSend(client, message);
  });
}

function broadcastToWebApps(message) {
  clients.forEach((client) => {
    if (!extensions.has(client)) {
      safeSend(client, message);
    }
  });
}

function broadcastToExtensions(message) {
  let sent = false;
  extensions.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      safeSend(client, message);
      sent = true;
    }
  });

  if (!sent) {
    console.warn("No connected extensions to send command to");
    broadcastToWebApps(
      JSON.stringify({
        type: "message",
        payload: "No browser extension connected",
      })
    );
  }
}

function broadcastToRegisteredExtensions(message) {
  let sent = false;
  registeredExtensions.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      safeSend(client, message);
      sent = true;
    }
  });

  if (!sent) {
    console.warn("No connected registered extensions to send command to");
    broadcastToWebApps(
      JSON.stringify({
        type: "message",
        payload: "No browser extension connected",
      })
    );
  }
}
