# Alris Server

A FastAPI-based server that powers Alris's automation engine, transforming natural language commands into executable tasks through both REST and WebSocket endpoints.

## Architecture

Alris follows a layered architecture with three distinct layers:

### 1. LangChain Agent Layer

- **Purpose**: The intelligent core that interprets and plans task execution.
- **Responsibilities**:
  - Uses language models to understand user intent
  - Breaks commands into actionable steps
  - Coordinates the use of tools via the MCP Layer
- **Components**: `AgentOrchestrator`, `BrowserAgent`, etc.

### 2. MCP (Model Context Protocol) Layer

- **Purpose**: A connector that links agents to external tools.
- **Responsibilities**:
  - Provides standardized access to tools like Playwright for browser automation
  - Manages tool invocation
- **Components**: `MCPConnector`, `AlrisMCPClient`

### 3. External Services Layer

- **Purpose**: Executes the tasks in the real world.
- **Responsibilities**:
  - Handles actions like browser navigation, form filling, or API calls
  - Includes services for browser automation, email, etc.
- **Components**: `BrowserService`, `EmailService`, etc.

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
- MCP (Model Context Protocol)
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

## Example Usage

Here's an example of how Alris processes the command "Fill out the form on example.com with name 'John'":

1. **LangChain Agent Layer**:
   - Interprets the command and plans steps: navigate to URL, find name field, input "John", submit
2. **MCP Connector Layer**:
   - Provides tools to the agent:
     - `navigate_to_url("https://example.com")`
     - `fill_form_field("#name", "John")`
     - `click_button("#submit")`
3. **External Services Layer (Playwright)**:
   - Executes the actions in a browser:
     - Loads the webpage
     - Inputs "John" in the name field
     - Submits the form

## API Endpoints

### WebSocket Endpoint

- `/ws` - WebSocket endpoint for real-time communication

### REST Endpoints

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
