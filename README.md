# Alris

A powerful command system that allows users to control their browser through voice or text commands. The project consists of three main components:

## Project Structure

- `client/`: Next.js web application for the user interface
- `extension/`: Chrome extension for browser control
- `server/`: WebSocket server handling command processing

## Quick Start

1. Start the server:

```bash
cd server
npm install
npm run dev
```

2. Start the client:

```bash
cd client
npm install
npm run dev
```

3. Load the extension:

- Open Chrome
- Go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `extension` folder

## Components Overview

### Client

A Next.js application that provides the user interface for sending commands and displaying responses. Connects to the server via WebSocket.

Features:

- Voice command input
- Text command input
- Real-time response display
- Command history

### Server

A Node.js WebSocket server that processes commands and communicates between the client and browser extension.

Features:

- Command processing
- WebSocket communication
- Error handling
- Event logging

### Extension

A Chrome extension that executes browser commands received from the server.

Features:

- Tab management
- Navigation control
- Bookmark handling
- Browser actions

## Available Commands

- `open [url]`: Opens a new tab with the specified URL
- `close`: Closes the current tab
- `back`: Navigates back in history
- `forward`: Navigates forward in history
- `refresh`: Reloads the current page
- `bookmark`: Bookmarks the current page

## Development

### Prerequisites

- Node.js 16+
- Chrome browser
- npm or yarn

### Testing

```bash
npm test
```

### Building

```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT
