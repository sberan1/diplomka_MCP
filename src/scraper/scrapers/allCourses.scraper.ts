import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { BaseScraper } from '../base-scraper';
import { BrowserService } from '../browser.service';
import {
  checkCheckboxByText,
  clickAndWaitForNavigation,
  getCheckedLabelInGroup,
} from '../puppeteer.utils';

export interface AllCoursesInput {
  /** Exact faculty checkbox label, e.g. 'Fakulta informatiky a statistiky'. */
  faculty: string;
}

export interface CourseListing {
  code: string;
  name: string;
  /** e.g. "ZS 2026/2027 - kurzy - FIS" - the programme/period suffix shown next to each result. */
  period: string;
  /** Absolute URL of the course's syllabus page. */
  syllabusUrl: string;
}

export interface AllCoursesResult {
  courses: CourseListing[];
}

/**
 * Scrapes VŠE's course catalogue ("Předměty dle pracovišť" tab, since
 * "Předměty dle jména" requires a >=3 character name query and can't list
 * everything). Verified live against https://insis.vse.cz/katalog/ - the
 * filter form has no <label> elements anywhere, every checkbox's text is
 * its own next sibling text node (see checkCheckboxByText).
 *
 * Academic year is always whatever INSIS has checked by default (the
 * current year), and both semesters are always included - this only ever
 * runs as a recurring cron, not on demand, so there's nothing to keep in
 * sync when the year rolls over or to pick per call.
 */
@Injectable()
export class AllCoursesScraper extends BaseScraper<
  AllCoursesInput,
  AllCoursesResult
> {
  constructor(browserService: BrowserService) {
    super(browserService);
  }

  protected async scrape(
    page: Page,
    { faculty }: AllCoursesInput,
  ): Promise<AllCoursesResult> {
    // A fresh Puppeteer session has no locale preference and INSIS falls
    // back to English, which breaks every Czech-text lookup below - force
    // Czech regardless of the environment this runs in.
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'cs-CZ,cs;q=0.9' });
    await page.goto('https://insis.vse.cz/katalog/index.pl?jak=dle_pracovist', {
      waitUntil: 'domcontentloaded',
    });

    // Checking the faculty checkbox reveals 8 sub-checkboxes for the
    // already-checked default year: {ZS, LS} x {regular, mba, kurzy,
    // doktorská studia}. Select all of them.
    await checkCheckboxByText(page, faculty);
    const year = await getCheckedLabelInGroup(page, 'obdobi');

    const otherProgrammeTypes = [' - mba', ' - kurzy', ' - doktorská studia'];
    for (const semester of ['ZS', 'LS'] as const) {
      for (const suffix of otherProgrammeTypes) {
        await checkCheckboxByText(
          page,
          `${semester} ${year}${suffix}`,
          { exact: false }, // label ends in "- <FACULTY_ABBR>", which we don't know here
        );
      }
      // The plain/regular listing has no " - <type>" segment at all, e.g.
      // "ZS 2026/2027 - FIS" - a bare prefix match on "ZS 2026/2027" would
      // ambiguously match one of the other three (whichever sorts first in
      // the DOM), so the other three's substrings must be excluded here.
      await checkCheckboxByText(page, `${semester} ${year}`, {
        exact: false,
        excludeSubstrings: otherProgrammeTypes,
      });
    }

    // "Vybrat" moves to an intermediate page (department-narrowing dropdown
    // + "Vypsat předměty" button); leaving the dropdown on its default
    // "-- všechna pracoviště --" returns every matching course.
    await clickAndWaitForNavigation(page, 'input[type="submit"]'); // "Vybrat"
    await clickAndWaitForNavigation(page, 'input[type="submit"]'); // "Vypsat předměty"

    const courses = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a')).filter((a) =>
        /^\d?[A-Z]{2,}\d/.test(a.textContent?.trim() ?? ''),
      );
      return links.map((a) => {
        const [code, ...nameParts] = (a.textContent ?? '').trim().split(' ');
        return {
          code,
          name: nameParts.join(' '),
          period: (a.nextSibling?.textContent ?? '')
            .replace(/^-\s*/, '')
            .trim(),
          syllabusUrl: (a as HTMLAnchorElement).href,
        };
      });
    });

    return { courses };
  }
}
