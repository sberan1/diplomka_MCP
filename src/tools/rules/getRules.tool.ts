import { Tool } from '@rekog/mcp-nest';
import { Injectable } from '@nestjs/common';
import { RulesService } from '../../rules/rules.service';

@Injectable()
export class GetRulesTool {
  constructor(private readonly rulesService: RulesService) {}

  @Tool({
    name: 'Get rules',
    description:
      'Returns all syllabus validation rules (code, name, description, type) that "Submit syllabus evaluation" checks are scored against.',
  })
  getRules() {
    return this.rulesService.getAllRules();
  }
}
