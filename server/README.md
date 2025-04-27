# Alris Server

A FastAPI-based server that provides browser automation and AI agent capabilities through both REST and WebSocket endpoints.

## Features

- Real-time communication via WebSocket
- Browser automation capabilities
- REST API endpoints
- AI agent integration
- Cross-Origin Resource Sharing (CORS) support

## Prerequisites

- Python 3.x
- Virtual environment (recommended)

## Dependencies

Major dependencies include:

- FastAPI
- Uvicorn
- Pydantic
- Playwright
- LangChain
- Google Generative AI
- WebSockets

## Installation

1. Clone the repository
2. Create and activate a virtual environment:

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

## Running the Server

Start the server using:

```bash
python run.py
```

The server will start on the default host and port (typically localhost:8000).

## API Endpoints

### WebSocket Endpoint

- `/ws` - WebSocket endpoint for real-time communication

### REST Endpoints

- `POST /command` - Process commands via REST API
- `GET /health` - Health check endpoint

## Browser Automation

The server includes browser automation capabilities through the following tools:

- General browser actions (navigation, form filling, clicking)
- YouTube search functionality
- Web navigation

## Error Handling

The server implements comprehensive error handling for both WebSocket and REST endpoints, providing clear error messages in case of failures.

## Security

- CORS is enabled with appropriate middleware
- Input validation using Pydantic models

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
