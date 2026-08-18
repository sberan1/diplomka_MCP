import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { BaseScraper } from '../base-scraper';
import { BrowserService } from '../browser.service';

export interface PageTitleInput {
  url: string;
}

export interface PageTitleResult {
  url: string;
  title: string;
}

/**
 * Minimal reference scraper - no login/DOM-scraping logic, just proves the
 * BrowserService/BaseScraper wiring works end to end. Model your real
 * scrapers (login flows, page.evaluate() extraction, etc.) on this shape.
 */
@Injectable()
export class PageTitleScraper extends BaseScraper<
  PageTitleInput,
  PageTitleResult
> {
  constructor(browserService: BrowserService) {
    super(browserService);
  }

  protected async scrape(
    page: Page,
    { url }: PageTitleInput,
  ): Promise<PageTitleResult> {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    return { url, title: await page.title() };
  }
}
