import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const pageLanguage = pgEnum('page_language', ['cs', 'en']);
export const ruleType = pgEnum('rule_type', [
  'error',
  'recommendation',
  'warning',
]);
export const checkResult = pgEnum('check_result', [
  'ok',
  'error',
  'warning',
  'cannot_verify',
]);

/** A course (předmět), identified by its stable course code. */
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name_cs: text('name_cs'),
  name_en: text('name_en'),
  syllabus_url: text('syllabus_url'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * A captured Czech or English syllabus page for a course. Every capture is
 * kept (archive) - `isCurrent` marks the latest one per (course, language),
 * enforced by a partial unique index so at most one row can be "current" at
 * a time.
 */
export const coursePages = pgTable(
  'course_pages',
  {
    id: serial('id').primaryKey(),
    courseId: integer('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    language: pageLanguage('language').notNull(),
    name: text('name').notNull(),
    teachingLanguage: text('teaching_language').notNull(),
    ectsCredits: integer('ects_credits').notNull(),
    isCurrent: boolean('is_current').notNull().default(true),
    capturedAt: timestamp('captured_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('course_pages_course_id_idx').on(table.courseId),
    uniqueIndex('course_pages_current_unique_idx')
      .on(table.courseId, table.language)
      .where(sql`${table.isCurrent} = true`),
  ],
);

/** Master list of validation rules (R1, R2, ...) that reports get scored against. */
export const rules = pgTable('rules', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  type: ruleType('type').notNull(),
});

/** A validation report submitted by the Copilot agent for a course. */
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  courseId: integer('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * One rule's outcome within a report. `report_rule_evaluations_report_rule_unique`
 * blocks the same rule being evaluated twice in one report; a deferred
 * constraint trigger (see migration 0001) additionally enforces that every
 * report ends up with exactly one evaluation per rule in `rules` - see
 * check_report_rule_completeness() in that migration.
 */
export const reportRuleEvaluations = pgTable(
  'report_rule_evaluations',
  {
    id: serial('id').primaryKey(),
    reportId: integer('report_id')
      .notNull()
      .references(() => reports.id, { onDelete: 'cascade' }),
    ruleId: integer('rule_id')
      .notNull()
      .references(() => rules.id, { onDelete: 'restrict' }),
    result: checkResult('result').notNull(),
    detail: text('detail').notNull(),
  },
  (table) => [
    unique('report_rule_evaluations_report_rule_unique').on(
      table.reportId,
      table.ruleId,
    ),
  ],
);

export const coursesRelations = relations(courses, ({ many }) => ({
  pages: many(coursePages),
  reports: many(reports),
}));

export const coursePagesRelations = relations(coursePages, ({ one }) => ({
  course: one(courses, {
    fields: [coursePages.courseId],
    references: [courses.id],
  }),
}));

export const rulesRelations = relations(rules, ({ many }) => ({
  evaluations: many(reportRuleEvaluations),
}));

export const reportsRelations = relations(reports, ({ one, many }) => ({
  course: one(courses, {
    fields: [reports.courseId],
    references: [courses.id],
  }),
  evaluations: many(reportRuleEvaluations),
}));

export const reportRuleEvaluationsRelations = relations(
  reportRuleEvaluations,
  ({ one }) => ({
    report: one(reports, {
      fields: [reportRuleEvaluations.reportId],
      references: [reports.id],
    }),
    rule: one(rules, {
      fields: [reportRuleEvaluations.ruleId],
      references: [rules.id],
    }),
  }),
);
