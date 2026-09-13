import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, DrizzleDatabase, schema } from '../database';

@Injectable()
export class RulesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  getAllRules() {
    return this.db.select().from(schema.rules);
  }
}
