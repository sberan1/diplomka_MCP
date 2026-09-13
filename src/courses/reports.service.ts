import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, DrizzleDatabase, schema } from '../database';

export interface RuleCheckInput {
  /** Rule code, e.g. "R1". */
  code: string;
  name: string;
  type: 'error' | 'recommendation' | 'warning';
  result: 'ok' | 'error' | 'warning' | 'cannot_verify';
  detail: string;
}

@Injectable()
export class ReportsService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  /**
   * Stores a validation report for a syllabus version (a coursePages row,
   * as returned by SyllabusService.refreshSyllabus).
   *
   * Rules referenced by `checks` are upserted by code: the rule taxonomy
   * doesn't have a separate registration step yet ("rules will later be
   * extracted via another tool"), so for now every submission is also how
   * a rule's name/type gets recorded or updated.
   *
   * report_rule_completeness_trigger (see migration 0001) requires the
   * inserted evaluations to cover every row currently in `rules`, checked
   * at COMMIT - if `checks` is missing a rule some other submission already
   * registered, this throws and nothing is persisted. That's the trigger
   * doing its job, not a bug to work around here.
   */
  async submitEvaluation(
    versionId: number,
    summary: string,
    checks: RuleCheckInput[],
  ) {
    const [anchor] = await this.db
      .select({ id: schema.coursePages.id })
      .from(schema.coursePages)
      .where(eq(schema.coursePages.id, versionId))
      .limit(1);
    if (!anchor) {
      throw new NotFoundException(
        `"${versionId}" is not a known syllabus version id - use the versionId returned by the syllabus tool.`,
      );
    }

    return this.db.transaction(async (tx) => {
      const [report] = await tx
        .insert(schema.reports)
        .values({ versionId, summary })
        .returning();

      for (const check of checks) {
        const [rule] = await tx
          .insert(schema.rules)
          .values({ code: check.code, name: check.name, type: check.type })
          .onConflictDoUpdate({
            target: schema.rules.code,
            set: { name: check.name, type: check.type },
          })
          .returning();

        await tx.insert(schema.reportRuleEvaluations).values({
          reportId: report.id,
          ruleId: rule.id,
          result: check.result,
          detail: check.detail,
        });
      }

      return report;
    });
  }
}
