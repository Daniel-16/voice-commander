# Alris

An automation system that transforms natural language commands into seamless task execution. Alris enables you to automate workflows, manage tasks, and control applications through simple, natural language instructions.

**Author:** Daniel Toba  
**Copyright:** © 2025 Daniel Toba  
**License:** [Apache License 2.0](LICENSE)

## Features

- Natural language command processing
- Task and workflow automation
- Process scheduling and management
- Real-time execution monitoring
- WebSocket-based communication
- Modern React-based UI with Next.js
- FastAPI backend with automation engine
- Cross-platform compatibility
- Secure and scalable architecture

## Prerequisites

- Python 3.x
- Node.js 16+
- npm or yarn
- Virtual environment (recommended for Python)

## Quick Start

### Client Setup

1. Navigate to client directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Server Setup

1. Navigate to server directory:

```bash
cd server
```

2. Create and activate virtual environment:

```bash
python -m venv myenv
source myenv/bin/activate  # On Linux/Mac
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Install Playwright browsers:

```bash
playwright install
```

5. Start the server:

```bash
python run.py
```

## Available Commands

The following commands are currently supported:

- `search [query]` - Performs a web search
- `open [url]` - Opens specified URL
- `play video of [query]` - Searches and plays videos
- `play music of [query]` - Searches and plays music

Examples:

```
search weather in London
open github.com
play video of cute puppies
play music of The Beatles
```

<!-- ## Technical Stack

### Frontend (Client)

- Next.js 15.2
- React 19
- TypeScript
- TailwindCSS
- Framer Motion
- Supabase Auth

### Backend (Server)

- FastAPI
- Uvicorn
- Pydantic
- Playwright
- LangChain
- Google Generative AI
- WebSockets -->

<!-- ## Development -->

## Security Features

- CORS protection
- Input validation
- Secure WebSocket communication
- Authentication and authorization
- Rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

Copyright (c) 2025 Daniel Toba

This project is licensed under the Apache License, Version 2.0 - see http://www.apache.org/licenses/LICENSE-2.0 for details.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
