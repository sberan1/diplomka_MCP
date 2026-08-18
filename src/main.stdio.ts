import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Entry point for running this app as a local MCP server over stdio (e.g.
 * from a Claude Desktop config). No HTTP listener is started, and Nest's
 * own logger is disabled since stdout is reserved for the MCP protocol
 * framing - any stray console output would corrupt the stream.
 *
 * @rekog/mcp-nest's StdioService auto-connects on application bootstrap
 * once AppModule resolves McpModule.forRoot() with the stdio transport
 * (see MCP_TRANSPORT in app.module.ts).
 */
async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule, { logger: false });
}

bootstrap();
