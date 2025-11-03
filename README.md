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

Install dependencies:

```bash
npm install
```

## Testing with MCP Inspector (Browser)

The easiest way to test and develop your MCP server is using the MCP Inspector, which provides a web interface:

```bash
npm run inspector:dev
```

This will:
1. Build the TypeScript code
2. Launch the MCP Inspector 
3. Open your browser to an interactive testing interface
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

## Next Steps (Implementation TODOs)

- Parse the pluglist XML response into typed structures
- Implement real logic for `find_plugin_latest_version` tool
- Add caching layer for the pluglist data
- Add more sophisticated plugin search and filtering tools
- Add error handling and input validation
