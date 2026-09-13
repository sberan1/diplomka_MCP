import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import { BaseScraper } from '../base-scraper';
import { BrowserService } from '../browser.service';
import { extractLabeledFields } from '../puppeteer.utils';

export interface SyllabusScraperInput {
  /** courses.syllabus_url, e.g. "https://insis.vse.cz/katalog/syllabus.pl?predmet=70976". */
  syllabusUrl: string;
}

export interface SyllabusPageContent {
  name: string;
  teachingLanguage: string;
  ectsCredits: number;
  completionForm: string | null;
  teachingForm: string | null;
  aims: string | null;
  learningOutcomes: string | null;
  courseContents: string | null;
  workloadSummary: string | null;
  assessmentMethods: string | null;
  specialRequirements: string | null;
  literature: string | null;
}

export interface SyllabusScraperResult {
  cs: SyllabusPageContent;
  en: SyllabusPageContent;
}

/**
 * INSIS's `jazyk` query param picks which language the syllabus *content*
 * (and its field labels) render in - 1 for Czech, 3 for English. This is
 * independent of the `lang` param/Accept-Language header, which only
 * affects the surrounding site chrome. Verified live against
 * https://insis.vse.cz/katalog/syllabus.pl?predmet=70976 .
 */
const JAZYK_CS = 1;
const JAZYK_EN = 3;

type FieldLabels = Record<
  keyof Omit<SyllabusPageContent, 'ectsCredits'>,
  string
> & {
  ectsCredits: string;
};

const CS_LABELS: FieldLabels = {
  name: 'Název česky',
  teachingLanguage: 'Jazyk výuky',
  ectsCredits: 'Počet přidělených ECTS kreditů',
  completionForm: 'Forma ukončení',
  teachingForm: 'Forma výuky',
  aims: 'Zaměření předmětu',
  learningOutcomes: 'Výsledky učení',
  courseContents: 'Obsah předmětu',
  workloadSummary: 'Způsob studia, metody výuky a studijní zátěž (počet hodin)',
  assessmentMethods: 'Způsoby a kritéria hodnocení',
  specialRequirements: 'Zvláštní podmínky a podrobnosti',
  literature: 'Literatura',
};

const EN_LABELS: FieldLabels = {
  name: 'Course title in English',
  teachingLanguage: 'Language of instruction',
  ectsCredits: 'Number of ECTS credits allocated',
  completionForm: 'Mode of completion',
  teachingForm: 'Mode of delivery',
  aims: 'Aims of the course',
  learningOutcomes: 'Learning outcomes and competences',
  courseContents: 'Course contents',
  workloadSummary: 'Learning activities, teaching methods and workload (hours)',
  assessmentMethods: 'Assessment methods and criteria',
  specialRequirements: 'Special requirements and details',
  literature: 'Reading',
};

/**
 * INSIS's own syllabus links use ';' as the query separator (e.g.
 * ".../syllabus.pl?predmet=70976;jazyk=1"); its Perl/CGI backend accepts
 * that the same way it accepts '&', so appending is enough - no need to
 * parse/rewrite whatever query string syllabusUrl already has.
 */
function withJazyk(syllabusUrl: string, jazyk: number): string {
  const separator = syllabusUrl.includes('?') ? ';' : '?';
  return `${syllabusUrl}${separator}jazyk=${jazyk}`;
}

@Injectable()
export class SyllabusScraper extends BaseScraper<
  SyllabusScraperInput,
  SyllabusScraperResult
> {
  constructor(browserService: BrowserService) {
    super(browserService);
  }

  protected async scrape(
    page: Page,
    { syllabusUrl }: SyllabusScraperInput,
  ): Promise<SyllabusScraperResult> {
    const cs = await this.scrapeLanguageVersion(
      page,
      syllabusUrl,
      JAZYK_CS,
      CS_LABELS,
    );
    const en = await this.scrapeLanguageVersion(
      page,
      syllabusUrl,
      JAZYK_EN,
      EN_LABELS,
    );
    return { cs, en };
  }

  private async scrapeLanguageVersion(
    page: Page,
    syllabusUrl: string,
    jazyk: number,
    labels: FieldLabels,
  ): Promise<SyllabusPageContent> {
    await page.goto(withJazyk(syllabusUrl, jazyk), {
      waitUntil: 'domcontentloaded',
    });
    const fields = await extractLabeledFields(page, labels);

    if (!fields.name) {
      throw new Error(
        `Could not find course title on syllabus page: ${syllabusUrl}`,
      );
    }
    const ectsMatch = fields.ectsCredits?.match(/\d+/);
    if (!fields.teachingLanguage || !ectsMatch) {
      throw new Error(
        `Could not parse required syllabus fields on: ${syllabusUrl}`,
      );
    }

    return {
      name: fields.name,
      teachingLanguage: fields.teachingLanguage,
      ectsCredits: Number(ectsMatch[0]),
      completionForm: fields.completionForm,
      teachingForm: fields.teachingForm,
      aims: fields.aims,
      learningOutcomes: fields.learningOutcomes,
      courseContents: fields.courseContents,
      workloadSummary: fields.workloadSummary,
      assessmentMethods: fields.assessmentMethods,
      specialRequirements: fields.specialRequirements,
      literature: fields.literature,
    };
  }
}
