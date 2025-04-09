# Voice Commander Chrome Extension

Chrome extension that executes browser commands received via WebSocket connection.

## Features

- WebSocket client connecting to local server
- Executes browser commands (open URLs, switch tabs, etc.)
- Background service worker for persistent connection
- Popup interface for status monitoring

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory

## Project Structure

- `manifest.json` - Extension configuration and permissions
- `background.js` - Service worker for WebSocket connection and command execution
- `popup.html` - Status display interface
- `popup.js` - Popup interface logic
- `icons/` - Extension icons in various sizes

## Permissions

The extension requires the following permissions:
- `tabs` - For tab manipulation
- `scripting` - For executing commands
- `activeTab` - For accessing the current tab
- `<all_urls>` - For working with any website

## Development

1. Make changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Check the extension's dev tools for any errors

## WebSocket Connection

The extension connects to `ws://localhost:8080` by default and listens for commands from the server.

## Command Types

The extension can handle various commands including:
- Opening URLs
- Switching tabs
- Browser navigation
- Tab management