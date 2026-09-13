import { Tool } from '@rekog/mcp-nest';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { SyllabusService } from '../../courses/syllabus.service';

@Injectable()
export class RefreshSyllabusTool {
  constructor(private readonly syllabusService: SyllabusService) {}

  @Tool({
    name: 'Refresh syllabus',
    description:
      'Scrapes the current Czech and English syllabus for a course from INSIS. Versions are identified by a hash of all syllabus fields: if the content changed since the stored version, it is stored as a new version (the previous one is kept in the archive) and changed=true is returned; otherwise the existing version is returned with changed=false and nothing is stored. Returns both language versions plus versionId, which the "Submit syllabus evaluation" tool takes as input. Only run a new evaluation when changed=true or alreadyEvaluated=false - re-evaluating unchanged content is pointless.',
    parameters: z.object({
      courseCode: z
        .string()
        .describe('The course code, e.g. "4IT101" (courses.code).'),
    }),
  })
  refreshSyllabus({ courseCode }: { courseCode: string }) {
    return this.syllabusService.refreshSyllabus(courseCode);
  }
}
