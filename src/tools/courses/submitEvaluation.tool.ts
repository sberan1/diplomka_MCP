import { Tool } from '@rekog/mcp-nest';
import { BadRequestException, Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ReportsService } from '../../courses/reports.service';

const checkSchema = z.object({
  code: z.string().describe('Rule code, e.g. "R1".'),
  name: z.string().describe('Human-readable rule name.'),
  type: z
    .enum(['error', 'recommendation', 'warning'])
    .describe('Rule severity/category.'),
  result: z
    .enum(['ok', 'error', 'warning', 'cannot_verify'])
    .describe('Outcome of checking this rule against the syllabus.'),
  detail: z.string().describe('Explanation of the result.'),
});

const checksArraySchema = z.array(checkSchema).min(1);

@Injectable()
export class SubmitEvaluationTool {
  constructor(private readonly reportsService: ReportsService) {}

  @Tool({
    name: 'Submit syllabus evaluation',
    description:
      'Stores a validation report - one result per rule - for a syllabus version. versionId must be the value returned by the "Refresh syllabus" tool.',
    parameters: z.object({
      versionId: z
        .number()
        .int()
        .describe('The versionId returned by the "Refresh syllabus" tool.'),
      summary: z.string().describe('Overall summary of the evaluation.'),
      // A nested array-of-objects parameter breaks clients that can only
      // fill scalar inputs (e.g. Copilot Studio flattens checks[].result
      // into a single scalar slot it then can't fill, since 12 rules have
      // 12 different results - it surfaces as an orphaned required input /
      // a SystemError instead of an MCP validation error). Taking `checks`
      // as a JSON string sidesteps that: nothing to flatten, and it's
      // parsed + validated against checksArraySchema below either way.
      checks: z
        .string()
        .describe(
          'JSON-encoded array of check objects, one per rule: ' +
            '[{"code":"R1","name":"...","type":"error|recommendation|warning","result":"ok|error|warning|cannot_verify","detail":"..."}, ...]. ' +
            'Must be a JSON string (e.g. JSON.stringify(checks)), not a native array.',
        ),
    }),
  })
  submitEvaluation({
    versionId,
    summary,
    checks,
  }: {
    versionId: number;
    summary: string;
    checks: string;
  }) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(checks);
    } catch {
      throw new BadRequestException(
        '`checks` must be a JSON-encoded array string, e.g. \'[{"code":"R1",...}]\'.',
      );
    }

    const result = checksArraySchema.safeParse(parsed);
    if (!result.success) {
      throw new BadRequestException(
        `Invalid \`checks\`: ${result.error.message}`,
      );
    }

    return this.reportsService.submitEvaluation(
      versionId,
      summary,
      result.data,
    );
  }
}
