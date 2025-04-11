# Alris Server

WebSocket server that processes commands and coordinates communication between the web client and Chrome extension.

## Features

- WebSocket server implementation using `ws` package
- Integration with Google's Generative AI for command processing
- Command validation and routing
- Real-time bidirectional communication

## Tech Stack

- Node.js
- WebSocket (ws)
- Google Generative AI (@google/generative-ai)
- dotenv for environment management

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the server directory with your Google AI API key:

```
GOOGLE_AI_API_KEY=your_api_key_here
```

3. Start the development server:

```bash
npm run dev
```

Or start in production mode:

```bash
npm start
```

## WebSocket Protocol

The server accepts and sends JSON messages in the following format:

### Client to Server:

```json
{
  "type": "command",
  "payload": "open google.com"
}
```

### Server to Client/Extension:

```json
{
  "type": "message|error",
  "payload": "string"
}
```

## Port

The server runs on port 8080 by default.
