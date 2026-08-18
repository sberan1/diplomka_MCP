import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { Tool } from '@rekog/mcp-nest';
import { PageTitleScraper } from '../scraper/examples/page-title.scraper';

/**
 * Example MCP tool backed by a Puppeteer scraper - shows how to expose a
 * BaseScraper as a tool. Replace PageTitleScraper with your own scraper.
 */
@Injectable()
export class PageTitleTool {
  constructor(private readonly pageTitleScraper: PageTitleScraper) {}

  @Tool({
    name: 'fetch-page-title',
    description:
      'Opens a URL in a real (Puppeteer-driven) browser and returns its page title.',
    parameters: z.object({
      url: z.string().url().describe('The absolute URL of the page to open.'),
    }),
  })
  async fetchPageTitle({ url }: { url: string }) {
    return this.pageTitleScraper.run({ url });
  }
}
