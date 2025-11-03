import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getCachedPluglist } from './pluginClient.js';

class MoodlePluginMCPServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: 'moodle-plugin-db-mcp',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();
        this.setupErrorHandler();
    }

    private setupToolHandlers() {
        // Handle tool discovery
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_raw_pluglist',
                        description: 'Fetch raw XML data from Moodle plugin database API',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                    {
                        name: 'find_plugin_latest_version',
                        description: 'Find the latest version of a plugin compatible with a specific Moodle version (placeholder)',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                plugin_name: {
                                    type: 'string',
                                    description: 'Name of the plugin (e.g., plagiarism_turnitin)',
                                },
                                moodle_version: {
                                    type: 'string',
                                    description: 'Moodle version (e.g., 4.5)',
                                },
                            },
                            required: ['plugin_name'],
                        },
                    },
                ],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'get_raw_pluglist': {
                        const rawData = await getCachedPluglist();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: rawData,
                                },
                            ],
                        };
                    }

                    case 'find_plugin_latest_version': {
                        const pluginName = args?.plugin_name as string;
                        const moodleVersion = args?.moodle_version as string;

                        if (!pluginName) {
                            throw new Error('plugin_name is required');
                        }

                        // TODO: Implement actual parsing and version finding logic
                        const result = {
                            plugin: pluginName,
                            moodle_version: moodleVersion || 'any',
                            status: 'placeholder',
                            message: 'This is a placeholder implementation. Real logic will parse the pluglist XML and find the latest compatible version.',
                        };

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(result, null, 2),
                                },
                            ],
                        };
                    }

                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    private setupErrorHandler() {
        this.server.onerror = (error) => {
            console.error('[MCP Error]:', error);
        };
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('[MCP Server] Moodle Plugin DB MCP server running on stdio');
    }
}

// Run the server
const server = new MoodlePluginMCPServer();
server.run().catch(console.error);
