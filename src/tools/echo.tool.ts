import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Tool } from '@rekog/mcp-nest';

/**
 * Minimal reference MCP tool - no external dependency, just proves the
 * McpModule.forFeature() wiring works. Model your own tools (e.g. ones
 * backed by a Puppeteer script) on this shape: an @Injectable() provider
 * with an @Tool()-decorated method, registered in ToolsModule.
 */
@Injectable()
export class EchoTool {
  @Tool({
    name: 'echo',
    description:
      'Echoes the given message back. Useful for testing the MCP connection.',
    parameters: z.object({
      message: z.string().describe('The message to echo back.'),
    }),
  })
  echo({ message }: { message: string }) {
    return { message };
  }
}
