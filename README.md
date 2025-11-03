# Moodle Plugin DB MCP Server

This repository contains a TypeScript-based MCP (Model Context Protocol) server for querying the Moodle plugin database API at:

https://download.moodle.org/api/1.3/pluglist.php

## What this provides

- **Proper MCP Server**: Built with `@modelcontextprotocol/sdk`
- **Tools**: 
  - `get_raw_pluglist`: Fetch raw XML data from Moodle plugin database
  - `find_plugin_latest_version`: Find latest version compatible with specific Moodle version (placeholder)
- **Browser Testing**: MCP Inspector integration for interactive testing
- **stdio Transport**: Compatible with Claude Desktop and other MCP clients

## Quick Start

### Local Development

Install dependencies:

```bash
npm install
```

### GitHub Codespaces (Recommended)

The easiest way to get started is using GitHub Codespaces:

1. **Create a GitHub repository** from this code
2. **Open in Codespaces**: Click the "Code" button → "Codespaces" → "Create codespace on main"
3. **Automatic setup**: The devcontainer will automatically:
   - Install Node.js 20
   - Run `npm install`
   - Configure VS Code with recommended extensions
   - Forward the necessary ports (3000, 6274, 6277)

### Testing with MCP Inspector (Browser)

The easiest way to test and develop your MCP server is using the MCP Inspector, which provides a web interface:

```bash
npm run inspector:dev
```

This will:
1. Build the TypeScript code
2. Launch the MCP Inspector 
3. Open your browser to an interactive testing interface (auto-forwarded in Codespaces)
4. Show you all available tools and let you test them

You can also run the inspector against an already-built version:

```bash
npm run build
npm run inspector
```

## Using with Claude Desktop

Add this to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "moodle-plugin-db": {
      "command": "node",
      "args": ["/absolute/path/to/moodle-plugin-db-mcp/dist/index.js"]
    }
  }
}
```

Then restart Claude Desktop and you'll see the tools available in the interface.

## Development

```bash
# Build TypeScript
npm run build

# Run the built server (stdio mode)
npm start
```

## Codespaces Features

This repository is configured for GitHub Codespaces with:

- **Pre-configured environment**: Node.js 20, TypeScript, and all dependencies
- **VS Code extensions**: TypeScript, Prettier, Copilot, and JSON support
- **Port forwarding**: MCP Inspector UI automatically opens in browser
- **Instant setup**: Ready to code in seconds

### Codespaces Port Configuration

- **Port 3000**: MCP Server (for direct connections)
- **Port 6274**: MCP Inspector UI (auto-opens in browser)
- **Port 6277**: MCP Inspector Proxy (background service)

## Next Steps (Implementation TODOs)

- Parse the pluglist XML response into typed structures
- Implement real logic for `find_plugin_latest_version` tool
- Add caching layer for the pluglist data
- Add more sophisticated plugin search and filtering tools
- Add error handling and input validation

## Contributing

1. Fork this repository
2. Open in GitHub Codespaces for instant development environment
3. Make your changes and test with `npm run inspector:dev`
4. Submit a pull request
