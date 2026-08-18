import { jsonb, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

/**
 * Placeholder table so `npm run db:generate` has something to work with.
 * Replace with your real tables (or delete this one) once you have a
 * schema - the DatabaseModule wiring doesn't depend on it.
 */
export const items = pgTable('items', {
  id: serial('id').primaryKey(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
