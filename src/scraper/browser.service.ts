import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Owns a single, lazily-launched Chromium instance shared across every
 * scraper run - launching Chromium per call is slow (~1-2s), so it's kept
 * alive for the lifetime of the process and relaunched only if it dies.
 *
 * Configurable via env:
 * - PUPPETEER_EXECUTABLE_PATH: point at a system Chromium (set in the
 *   Docker image; leave unset locally to use Puppeteer's bundled browser).
 * - PUPPETEER_HEADLESS=false: launch a visible browser for debugging.
 */
@Injectable()
export class BrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(BrowserService.name);
  private browser?: Browser;
  private launching?: Promise<Browser>;

  constructor(private readonly config: ConfigService) {}

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.connected) {
      return this.browser;
    }

    if (!this.launching) {
      this.launching = puppeteer
        .launch({
          headless: this.config.get('PUPPETEER_HEADLESS') !== 'false',
          executablePath: this.config.get<string>('PUPPETEER_EXECUTABLE_PATH'),
          args: [
            '--disable-gpu',
            '--disable-setuid-sandbox',
            '--no-sandbox',
            '--no-zygote',
          ],
        })
        .then((browser) => {
          this.logger.log('Chromium launched');
          browser.once('disconnected', () => {
            this.logger.warn('Chromium disconnected');
            this.browser = undefined;
          });
          this.browser = browser;
          this.launching = undefined;
          return browser;
        });
    }

    return this.launching;
  }

  /**
   * Runs `fn` against a fresh page, closing it afterwards regardless of
   * outcome. This is the low-level primitive - use it directly for
   * one-off scripts, or extend BaseScraper for a reusable, DI-injectable
   * scraper.
   */
  async withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      return await fn(page);
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.browser?.close();
  }
}
