import { Module } from '@nestjs/common';
import { ScraperModule } from '../scraper/scraper.module';
import { RetrieveAllCoursesCron } from './retrieve-all-courses.cron';

@Module({
  imports: [ScraperModule],
  providers: [RetrieveAllCoursesCron],
})
export class CronsModule {}
