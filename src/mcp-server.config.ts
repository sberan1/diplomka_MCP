/**
 * Shared identity of the MCP server, used both by McpModule.forRoot() in
 * AppModule and by McpModule.forFeature() in feature modules that register
 * tools against it (the two must reference the same server name).
 */
export const MCP_SERVER_NAME = 'diplomka-mcp';
export const MCP_SERVER_VERSION = '0.0.1';
