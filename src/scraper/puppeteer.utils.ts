import { ElementHandle, Page } from 'puppeteer';

const NON_BREAKING_SPACE = String.fromCharCode(160);

/**
 * Clicks `selector` and waits for the navigation it triggers, without
 * racing it - you have to start waiting for navigation before the click
 * settles, not after (a naive `await click(); await waitForNavigation();`
 * can miss the navigation if it starts mid-click and finishes before the
 * second line runs).
 */
export async function clickAndWaitForNavigation(
  page: Page,
  selector: string,
): Promise<void> {
  const navigation = page.waitForNavigation();
  await page.locator(selector).click();
  await navigation;
}

export interface CheckboxTextOptions {
  /**
   * false matches by prefix instead of exact equality - useful for
   * "2026/2027" also matching "2026/2027 - FIS" variants with trailing
   * content. Defaults to true (exact match).
   */
  exact?: boolean;
  /**
   * With `exact: false`, reject any label containing one of these
   * substrings even though it matches the prefix. Needed because prefix
   * matching alone is ambiguous when several labels share the same
   * prefix but differ in a middle segment - e.g. "ZS 2026/2027 - FIS"
   * (the plain/regular course listing) is a prefix-match false positive
   * for "ZS 2026/2027 - doktorská studia - FIS" too, since nothing about
   * "startsWith" stops at the first extra " - segment".
   */
  excludeSubstrings?: string[];
}

/**
 * Finds a checkbox/radio input whose visible label - its own next sibling
 * text node, since on INSIS there are no <label> elements anywhere - is
 * visible on the page. Runs as `page.waitForFunction`, so it polls rather
 * than checking once: sub-options can take a moment to become visible
 * after their parent checkbox is checked (the DOM update isn't
 * necessarily synchronous with the click), and plain ElementHandle.click()
 * - unlike Locator.click() - doesn't retry on its own.
 *
 * Czech typography puts a non-breaking space after one-letter words like
 * "a"/"v"/"k" (e.g. "informatiky a statistiky") so they don't end a line
 * alone - both the label and `text` are normalized to regular spaces
 * before comparing, since `.trim()` alone only strips the ends and leaves
 * those in the middle untouched.
 */
async function findVisibleCheckboxByText(
  page: Page,
  text: string,
  options: CheckboxTextOptions,
): Promise<ElementHandle<HTMLInputElement>> {
  const exact = options.exact ?? true;
  const excludeSubstrings = options.excludeSubstrings ?? [];
  const normalizedNeedle = text.split(NON_BREAKING_SPACE).join(' ');
  const handle = await page.waitForFunction(
    (needle, matchExact, excludes, nbsp) => {
      const inputs = document.querySelectorAll(
        'input[type="checkbox"], input[type="radio"]',
      );
      for (const input of inputs) {
        const label = (input.nextSibling?.textContent ?? '')
          .split(nbsp)
          .join(' ')
          .trim();
        const matches = matchExact
          ? label === needle
          : label.startsWith(needle) &&
            !excludes.some((s) => label.includes(s));
        if (matches && (input as HTMLInputElement).offsetParent !== null) {
          return input;
        }
      }
      return null;
    },
    {},
    normalizedNeedle,
    exact,
    excludeSubstrings,
    NON_BREAKING_SPACE,
  );

  const element = handle.asElement() as ElementHandle<HTMLInputElement> | null;
  if (!element) {
    throw new Error(
      `Could not find a visible checkbox/radio labelled "${text}"`,
    );
  }
  return element;
}

/**
 * Ensures a checkbox/radio is checked (see findVisibleCheckboxByText for
 * how it's located). Only clicks if it isn't already checked - some
 * options (e.g. the current academic year) are checked by default, and
 * blindly clicking would uncheck them and collapse whatever sub-options
 * they reveal.
 */
export async function checkCheckboxByText(
  page: Page,
  text: string,
  options: CheckboxTextOptions = {},
): Promise<void> {
  const element = await findVisibleCheckboxByText(page, text, options);
  const alreadyChecked = await element.evaluate((el) => el.checked);
  if (!alreadyChecked) {
    await element.click();
  }
  await element.dispose();
}

/**
 * Reads the visible label of whichever checkbox/radio in a same-`name`
 * group is currently checked - e.g. INSIS checks the current academic
 * year by default (`name="obdobi"`). Scraping "whatever's checked by
 * default" instead of a specific year means there's nothing to keep in
 * sync when the academic year rolls over.
 */
export async function getCheckedLabelInGroup(
  page: Page,
  groupName: string,
): Promise<string> {
  const label = await page.$$eval(
    `input[name="${groupName}"]`,
    (inputs, nbsp) => {
      const checked = (inputs as HTMLInputElement[]).find((i) => i.checked);
      return (checked?.nextSibling?.textContent ?? '')
        .split(nbsp)
        .join(' ')
        .trim();
    },
    NON_BREAKING_SPACE,
  );

  if (!label) {
    throw new Error(`No checked input found in group "${groupName}"`);
  }
  return label;
}

/**
 * Reads a set of "label: value" fields off an INSIS-style page in one pass,
 * keyed by whatever keys `labels` uses. Handles both layouts seen on the
 * syllabus page:
 * - same-row: `<tr><td><b>Label: </b></td><td>value</td></tr>`
 * - stacked: `<tr><td colspan="2"><b>Label: </b></td></tr>` followed by a
 *   separate `<tr><td colspan="2">value</td></tr>` - used for the longer
 *   free-text sections (aims, learning outcomes, literature, ...).
 *
 * Missing fields resolve to null rather than throwing, since not every
 * syllabus fills in every section (e.g. "special requirements" is often
 * blank) - callers decide what's actually required.
 */
export async function extractLabeledFields<K extends string>(
  page: Page,
  labels: Record<K, string>,
): Promise<Record<K, string | null>> {
  return page.evaluate(
    (labelsArg, nbsp) => {
      const normalize = (s: string) => s.split(nbsp).join(' ').trim();
      const rows = Array.from(document.querySelectorAll('tr'));

      function findValue(labelText: string): string | null {
        for (let i = 0; i < rows.length; i++) {
          const bold = rows[i].querySelector('b');
          if (!bold) continue;
          const label = normalize(bold.textContent ?? '').replace(/:$/, '');
          if (label !== labelText) continue;

          const tds = rows[i].querySelectorAll('td');
          if (tds.length >= 2) {
            return (tds[tds.length - 1] as HTMLElement).innerText.trim();
          }
          const nextCell = rows[i + 1]?.querySelector(
            'td',
          ) as HTMLElement | null;
          return nextCell ? nextCell.innerText.trim() : null;
        }
        return null;
      }

      const result = {} as Record<string, string | null>;
      for (const [key, labelText] of Object.entries(labelsArg)) {
        result[key] = findValue(labelText as string);
      }
      return result;
    },
    labels,
    NON_BREAKING_SPACE,
  ) as Promise<Record<K, string | null>>;
}
