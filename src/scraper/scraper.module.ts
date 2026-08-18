import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrowserService } from './browser.service';

/**
 * Puppeteer scaffolding: import this wherever you need a browser, then
 * either call BrowserService.withPage() directly or extend BaseScraper.
 */
@Module({
  imports: [ConfigModule],
  providers: [BrowserService],
  exports: [BrowserService],
})
export class ScraperModule {}
