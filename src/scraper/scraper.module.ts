import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BrowserService } from './browser.service';
import { AllCoursesScraper } from './scrapers/allCourses.scraper';

/**
 * Puppeteer scaffolding: import this wherever you need a browser, then
 * either call BrowserService.withPage() directly or extend BaseScraper.
 * Concrete scrapers used by more than one consumer (like AllCoursesScraper)
 * live here too, exported so every importer shares the same instance
 * instead of each redeclaring - and re-launching - their own.
 */
@Module({
  imports: [ConfigModule],
  providers: [BrowserService, AllCoursesScraper],
  exports: [BrowserService, AllCoursesScraper],
})
export class ScraperModule {}
