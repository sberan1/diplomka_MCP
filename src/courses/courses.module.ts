import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { ScraperModule } from '../scraper/scraper.module';

@Module({
  imports: [ScraperModule],
  providers: [CoursesService],
})
export class CoursesModule {}
