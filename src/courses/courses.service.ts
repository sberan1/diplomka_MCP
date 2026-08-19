import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDatabase, schema } from '../database';

@Injectable()
export class CoursesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}
  public async getAllCourses() {
    return this.db
      .select({ code: schema.courses.code, name: schema.courses.name_cs })
      .from(schema.courses);
  }
}
