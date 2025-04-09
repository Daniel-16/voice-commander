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

async function getCommandFromLLM(userInput) {
  const prompt = `
        Convert voice input to JSON for browser control. Supported actions:

        open_url: URL (e.g., "youtube.com")

        click: CSS selector (e.g., ".btn")
        scroll: Pixels (e.g., 300 for down, -300 for up)
        type: { "selector": "#field", "text": "value" }
        navigate: "back", "forward", "refresh"
        close_tab: No value

        Rules:

        Output strictly JSON: { "action": "ACTION_NAME", "value": VALUE } or {} if unsupported.

        Infer HTTPS URLs and common domains (e.g., "Google" -> "google.com", "YouTube" -> "youtube.com"). For "open google.com", use "google.com".

        For scrolling, "down" usually means 300 pixels, "up" means -300. "scroll to top" means 0, "scroll to bottom" means a very large positive number like 10000. Infer pixel value if not specified.

        For clicking, try to infer a CSS selector like a class, ID, or attribute. E.g. "click login" might be ".login", "#login-button", or "[aria-label='login']". Prioritize simple selectors. Use the text itself if no other cue exists, like "button containing 'Submit'". For simple link text like "click products", try "a:contains('products')" or similar. Be specific. If target is ambiguous (e.g. "click button"), output {}.

        For typing, identify the text and the target field selector. E.g., "type hello world in the search box" -> { "action": "type", "value": { "selector": "#search", "text": "hello world" } }. Infer common selectors like '#search' or 'input[name="q"]' for search. If target field is unclear, output {}.

        If the command is ambiguous, unsupported, conversational, or doesn't match any action, output {}.

        Ensure the output is only the JSON object or {}.

        Examples:

        "open YouTube" -> { "action": "open_url", "value": "youtube.com" }

        "open tech crunch dot com" -> { "action": "open_url", "value": "techcrunch.com" }

        "click the login button" -> { "action": "click", "value": ".login" } (or #login-button, etc.)

        "click sign up" -> { "action": "click", "value": "[aria-label='sign up']" } (example)

        "scroll down a bit" -> { "action": "scroll", "value": 300 }

        "scroll up" -> { "action": "scroll", "value": -300 }

        "scroll to the top" -> { "action": "scroll", "value": 0 }

        "type hello world in search" -> { "action": "type", "value": { "selector": "#search", "text": "hello world" } }

        "type my username in the user field" -> { "action": "type", "value": { "selector": "#username", "text": "my username" } }

        "go back" -> { "action": "navigate", "value": "back" }

        "refresh the page" -> { "action": "navigate", "value": "refresh" }

        "go forward" -> { "action": "navigate", "value": "forward" }

        "close this tab" -> { "action": "close_tab", "value": null }

        "what is the weather" -> {}

        "fly to the moon" -> {}

        "make me a sandwich" -> {}

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
