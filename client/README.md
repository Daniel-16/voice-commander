# Voice Commander Client

The client-side web application built with Next.js, providing a user interface for sending voice and text commands.

## Features

- Real-time WebSocket communication with the server
- Voice command support
- Text command input
- Command history and response display
- Status indicators for connection and command processing

## Tech Stack

- Next.js 15.2.5
- React 19
- TailwindCSS
- TypeScript
- WebSocket for real-time communication

## Development

First, install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

- `app/` - Next.js app directory containing:
  - `page.tsx` - Main application page
  - `layout.tsx` - Root layout component
  - `globals.css` - Global styles
- `public/` - Static assets
  - Icons and images

## Environment Variables

No environment variables are required as the WebSocket URL is hardcoded to `ws://localhost:8080` for development.

## Building for Production

```bash
npm run build
npm start
```
