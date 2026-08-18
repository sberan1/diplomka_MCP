import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { ScraperModule } from '../scraper/scraper.module';
import { PageTitleScraper } from '../scraper/examples/page-title.scraper';
import { MCP_SERVER_NAME } from '../mcp-server.config';
import { EchoTool } from './echo.tool';
import { PageTitleTool } from './page-title.tool';

/**
 * Home for MCP tool providers. Add new @Tool()-decorated providers here (or
 * in their own feature module) and list them in McpModule.forFeature() so
 * @rekog/mcp-nest's discovery picks them up for the 'diplomka-mcp' server -
 * it only scans providers declared directly on modules that import
 * McpModule (forRoot or forFeature), not arbitrary imported dependencies.
 */
@Module({
  imports: [
    ScraperModule,
    McpModule.forFeature([EchoTool, PageTitleTool], MCP_SERVER_NAME),
  ],
  providers: [EchoTool, PageTitleTool, PageTitleScraper],
})
export class ToolsModule {}
