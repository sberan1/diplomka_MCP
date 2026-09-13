import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { SyllabusService } from './syllabus.service';
import { ReportsService } from './reports.service';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [ScraperModule],
  providers: [CoursesService, SyllabusService, ReportsService],
})
export class CoursesModule {}
