import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DRIZZLE } from './database.constants';
import { PgPoolService } from './pg-pool.service';
import * as schema from './schema';

/**
 * Wires a Drizzle/node-postgres connection into Nest's DI container as a
 * plain custom provider - the same pattern Nest's own docs use for
 * TypeORM/Mongoose-style integrations that don't ship an official module.
 * Inject it with `@Inject(DRIZZLE) private readonly db: DrizzleDatabase`.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PgPoolService,
    {
      provide: DRIZZLE,
      inject: [PgPoolService],
      useFactory: (pgPool: PgPoolService) => drizzle(pgPool.pool, { schema }),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
