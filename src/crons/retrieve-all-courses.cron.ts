import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AllCoursesScraper } from '../scraper/scrapers/allCourses.scraper';
import { DRIZZLE, DrizzleDatabase, schema } from '../database';

/**
 * @Cron() only schedules future runs - OnApplicationBootstrap fires the
 * same handler once right after startup too, so you don't have to wait
 * for the next 3am to see it run.
 */
@Injectable()
export class RetrieveAllCoursesCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(RetrieveAllCoursesCron.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDatabase,
    private readonly allCoursesScraper: AllCoursesScraper,
  ) {}

  onApplicationBootstrap() {
    void this.handleCron();
  }

  @Cron(CronExpression.EVERY_QUARTER)
  async handleCron() {
    this.logger.log('Retrieving all courses...');
    // Year and semester aren't picked here - the scraper always uses
    // whatever academic year INSIS has checked by default (the current
    // one) and includes both semesters.
    // TODO: pick real faculty value (or loop over several).
    const { courses } = await this.allCoursesScraper.run({
      faculty: 'Fakulta informatiky a statistiky',
    });
    this.logger.log(`Retrieved ${courses.length} courses`);

    // The same course code can appear more than once (offered under
    // several programme types - regular/mba/kurzy/doktorská studia - in
    // both semesters), and a single bulk INSERT ... ON CONFLICT can't
    // update the same conflict target twice. Keep one row per code.
    const uniqueCourses = [
      ...new Map(courses.map((c) => [c.code, c])).values(),
    ];

    await this.db
      .insert(schema.courses)
      .values(
        uniqueCourses.map((c) => ({
          code: c.code,
          name_cs: c.name,
          syllabus_url: c.syllabusUrl,
        })),
      )
      .onConflictDoNothing({
        target: schema.courses.code,
      })
      .execute();
  }
}
