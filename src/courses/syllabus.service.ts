import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDatabase, schema } from '../database';
import {
  SyllabusPageContent,
  SyllabusScraper,
} from '../scraper/scrapers/syllabus.scraper';

export interface SyllabusVersion {
  /** Id of the cs page row - what report submissions target. */
  versionId: number;
  /** False when both pages hashed the same as stored rows - nothing new was stored. */
  changed: boolean;
  /** True when a report already exists for this versionId. */
  alreadyEvaluated: boolean;
  cs: typeof schema.coursePages.$inferSelect;
  en: typeof schema.coursePages.$inferSelect;
}

/** Fixed key order so the hash only depends on content, not object shape. */
const HASHED_FIELDS: (keyof SyllabusPageContent)[] = [
  'name',
  'teachingLanguage',
  'ectsCredits',
  'completionForm',
  'teachingForm',
  'aims',
  'learningOutcomes',
  'courseContents',
  'workloadSummary',
  'assessmentMethods',
  'specialRequirements',
  'literature',
];

export function hashPage(page: SyllabusPageContent): string {
  return createHash('sha256')
    .update(JSON.stringify(HASHED_FIELDS.map((f) => page[f] ?? null)))
    .digest('hex');
}

@Injectable()
export class SyllabusService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDatabase,
    private readonly syllabusScraper: SyllabusScraper,
  ) {}

  /**
   * Scrapes the current cs+en syllabus for a course from INSIS. Each page
   * is stored under the hash of its content: a page whose hash already
   * exists is reused, otherwise a new row is inserted. changed=false means
   * neither page was new. Returns both rows plus the version id (the cs
   * row's id), which SubmitEvaluationTool takes as input.
   */
  async refreshSyllabus(courseCode: string): Promise<SyllabusVersion> {
    const [course] = await this.db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.code, courseCode))
      .limit(1);
    if (!course) {
      throw new NotFoundException(`Unknown course code "${courseCode}"`);
    }
    if (!course.syllabus_url) {
      throw new BadRequestException(
        `Course "${courseCode}" has no syllabus URL on record yet`,
      );
    }

    const scraped = await this.syllabusScraper.run({
      syllabusUrl: course.syllabus_url,
    });

    const [cs, csNew] = await this.upsertPage(course.id, 'cs', scraped.cs);
    const [en, enNew] = await this.upsertPage(course.id, 'en', scraped.en);
    const changed = csNew || enNew;

    const [report] = changed
      ? []
      : await this.db
          .select({ id: schema.reports.id })
          .from(schema.reports)
          .where(eq(schema.reports.versionId, cs.id))
          .limit(1);

    return {
      versionId: cs.id,
      changed,
      alreadyEvaluated: !!report,
      cs,
      en,
    };
  }

  /** Returns the row for this content plus whether it was just inserted. */
  private async upsertPage(
    courseId: number,
    language: 'cs' | 'en',
    page: SyllabusPageContent,
  ): Promise<[typeof schema.coursePages.$inferSelect, boolean]> {
    const contentHash = hashPage(page);
    const [existing] = await this.db
      .select()
      .from(schema.coursePages)
      .where(eq(schema.coursePages.contentHash, contentHash))
      .limit(1);
    if (existing) {
      return [existing, false];
    }
    const [row] = await this.db
      .insert(schema.coursePages)
      .values({ courseId, language, contentHash, ...page })
      .returning();
    return [row, true];
  }
}
