import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getCachedPluglist, getCacheStatus, clearPluglistCache, findPluginLatestVersion, setCacheDir } from './pluginClient.js';

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
        this.setupInitializeHandler();
    }

    private setupToolHandlers() {
        // Handle tool discovery
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'get_raw_pluglist',
                        description: 'Fetch raw JSON data from Moodle plugin database API (with caching)',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
                        },
                    },
                    {
                        name: 'find_latest_plugin_version',
                        description: 'Find the latest version of a plugin compatible with a Moodle version or release',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                plugin_name: {
                                    type: 'string',
                                    description: 'Name of the plugin component (e.g., mod_attendance)',
                                },
                                moodle_identifier: {
                                    type: 'string',
                                    description: 'Moodle identifier: 10-digit version number (e.g., "2022111500") or major release (e.g., "4.1")',
                                },
                            },
                            required: ['plugin_name', 'moodle_identifier'],
                        },
                    },
                    {
                        name: 'get_cache_status',
                        description: 'Get information about the current cache status',
                        inputSchema: {
                            type: 'object',
                            properties: {},
                            required: [],
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

                    case 'find_latest_plugin_version': {
                        const pluginName = args?.plugin_name as string;
                        const moodleIdentifier = args?.moodle_identifier as string;

                        if (!pluginName || !moodleIdentifier) {
                            throw new Error('plugin_name and moodle_identifier are required');
                        }

                        // Parse the moodle_identifier
                        let moodleVersion: number | undefined;
                        let moodleRelease: string | undefined;
                        let targetDesc: string;

                        if (/^\d{10}$/.test(moodleIdentifier)) {
                            // 10-digit version number
                            moodleVersion = parseInt(moodleIdentifier, 10);
                            targetDesc = `version ${moodleVersion}`;
                        } else if (/^\d+\.\d+$/.test(moodleIdentifier)) {
                            // Major release format
                            moodleRelease = moodleIdentifier;
                            targetDesc = `release "${moodleRelease}"`;
                        } else {
                            throw new Error('Invalid moodle_identifier format. Expected 10-digit version number or major release (e.g., "4.1").');
                        }

                        const result = await findPluginLatestVersion(pluginName, moodleVersion, moodleRelease);

                        if (!result) {
                            return {
                                content: [
                                    {
                                        type: 'text',
                                        text: `Plugin "${pluginName}" not found or no compatible version available for Moodle ${targetDesc}.`,
                                    },
                                ],
                            };
                        }

                        const { plugin, latestVersion } = result;

                        const response = {
                            plugin_name: plugin.component,
                            plugin_display_name: plugin.name,
                            moodle_target: targetDesc,
                            latest_version: {
                                version: latestVersion.version,
                                release: latestVersion.release,
                                maturity: latestVersion.maturity,
                                maturity_text: latestVersion.maturity === 200 ? 'Stable' :
                                             latestVersion.maturity === 100 ? 'Beta' :
                                             latestVersion.maturity === 50 ? 'Alpha' : 'Unknown',
                                download_url: latestVersion.downloadurl,
                                download_md5: latestVersion.downloadmd5,
                                release_date: new Date(latestVersion.timecreated * 1000).toISOString(),
                                supported_moodle_versions: latestVersion.supportedmoodles.map(m => ({
                                    version: m.version,
                                    release: m.release
                                }))
                            },
                            plugin_info: {
                                source_url: plugin.source,
                                documentation_url: plugin.doc || null,
                                bugs_url: plugin.bugs,
                                discussion_url: plugin.discussion
                            }
                        };

                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: JSON.stringify(response, null, 2),
                                },
                            ],
                        };
                    }

                    case 'get_cache_status': {
                        const status = await getCacheStatus();
                        const ageMinutes = status.age ? Math.round(status.age / (1000 * 60)) : 0;
                        const ttlMinutes = Math.round(status.ttl / (1000 * 60));

                        const result = {
                            has_cache: status.hasCache,
                            cache_age_minutes: ageMinutes,
                            cache_ttl_minutes: ttlMinutes,
                            is_cache_valid: status.hasCache && status.age! < status.ttl,
                            next_refresh_in_minutes: status.hasCache ? Math.max(0, ttlMinutes - ageMinutes) : 0
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

                    case 'clear_cache': {
                        await clearPluglistCache();
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: 'Cache cleared successfully. Next request will fetch fresh data.',
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

    private setupInitializeHandler() {
        this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
            const settings = (request.params?.initializationOptions as any)?.settings;
            if (settings?.cacheDir) {
                setCacheDir(settings.cacheDir);
            }
            return {
                protocolVersion: '2024-11-05',
                capabilities: {
                    tools: {},
                    settings: {
                        type: 'object',
                        properties: {
                            cacheDir: {
                                type: 'string',
                                description: 'Directory to store cache files (defaults to temp directory)'
                            }
                        }
                    }
                },
                serverInfo: {
                    name: 'moodle-plugin-db-mcp',
                    version: '0.1.0',
                },
            };
        });
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
