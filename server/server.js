import "dotenv/config";
import WebSocket from "ws";
import { GoogleGenerativeAI } from "@google/generative-ai";

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.error("GOOGLE_API_KEY is not set in the environment variables.");
  process.exit(1);
}

const genAi = new GoogleGenerativeAI(API_KEY);
const model = genAi.getGenerativeModel({ model: "gemini-pro" });
const wss = new WebSocket.Server({ port: PORT });

console.log(`Websocket started on port ${PORT}`);

const clients = new Set();
const extensions = new Set();

wss.on("connection", (ws, req) => {
  console.log("Client connected");
  clients.add(ws);

  const clientType = req.url === "/extensions" ? "extension" : "webapp";
  if (clientType === "extension") {
    extensions.add(ws);
    console.log("Extension client connected");
  } else {
    console.log("Webapp client connected");
    safeSend(ws, JSON.stringify({ type: "message", payload: "Ready" }));
  }

  ws.on("message", async (message) => {
    console.log("Received message:", message);
    let data;
    try {
      data = JSON.parse(message.toString());
    } catch (error) {
      consoler.error("Error parsing message:", error);
      safeSend(ws, JSON.stringify({ type: "error", payload: "Invalid JSON" }));
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
          const commandMessage = JSON.stringify({
            type: "command",
            payload: commandJson,
          });
          broadcastToExtensions(commandMessage);
        } else {
          console.log("Unsupported or ambiguous command");
          broadcastToWebApps(
            JSON.stringify({
              type: "message",
              payload: "Unsupported or ambiguous command",
            })
          );
          setTimeout(() => {
            broadcastToWebApps(
              JSON.stringify({ type: "message", payload: "Ready" })
            );
          }, 1500);
        }
      } catch (error) {
        console.error("Error processing command:", error);
        broadcastToWebApps(
          JSON.stringify({
            type: "message",
            payload: "Error processing command",
          })
        );
        setTimeout(() => {
          broadcastToWebApps(
            JSON.stringify({ type: "message", payload: "Ready" })
          );
        }, 1500);
      }
    } else if (data.type === "execution_confirmation" && data.payload) {
      console.log("Execution confirmation received:", data.payload);
      broadcastToWebApps(
        JSON.stringify({ type: "message", payload: "Execution confirmed" })
      );
      setTimeout(() => {
        broadcastToWebApps(
          JSON.stringify({ type: "message", payload: "Ready" })
        );
      }, 1500);
    } else if (data.type === "execution_error" && data.payload) {
      console.error("Execution error from extension:", data.payload);
      broadcastToWebApps(
        JSON.stringify({ type: "message", payload: "Execution error" })
      );
      setTimeout(() => {
        broadcastToWebApps(
          JSON.stringify({ type: "message", payload: "Ready" })
        );
      }, 2000);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
    extensions.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
    extensions.delete(ws);
  });
});


