import { Page } from 'puppeteer';
import { BrowserService } from './browser.service';

/**
 * Base class for concrete scrapers: `run(input)` opens a fresh page, hands
 * it (plus your input) to `scrape()`, and closes it afterwards. Extend this
 * for anything you want to call repeatedly and inject elsewhere (e.g. from
 * an MCP tool); for a one-off script, `BrowserService.withPage()` alone is
 * enough.
 *
 * @example
 * ```ts
 * @Injectable()
 * export class RefereeAssignmentsScraper extends BaseScraper<
 *   { login: string; password: string },
 *   Assignment[]
 * > {
 *   constructor(browserService: BrowserService) {
 *     super(browserService);
 *   }
 *
 *   protected async scrape(page: Page, { login, password }) {
 *     await page.goto('https://cabr.cbf.cz/prihlaseni.html', {
 *       waitUntil: 'domcontentloaded',
 *     });
 *     // ...fill in the login form, navigate, page.evaluate(...)
 *   }
 * }
 * ```
 */
export abstract class BaseScraper<TInput, TOutput> {
  protected constructor(protected readonly browserService: BrowserService) {}

  run(input: TInput): Promise<TOutput> {
    return this.browserService.withPage((page) => this.scrape(page, input));
  }

  protected abstract scrape(page: Page, input: TInput): Promise<TOutput>;
}
