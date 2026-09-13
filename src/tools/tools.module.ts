import { Module } from '@nestjs/common';
import { McpModule } from '@rekog/mcp-nest';
import { ScraperModule } from '../scraper';
import { MCP_SERVER_NAME } from '../mcp-server.config';
import { EchoTool } from './echo.tool';
import { CoursesService } from '../courses/courses.service';
import { SyllabusService } from '../courses/syllabus.service';
import { ReportsService } from '../courses/reports.service';
import { RulesService } from '../rules/rules.service';
import { GetAllCoursesTool } from './courses/getAllCourses.tool';
import { RefreshSyllabusTool } from './courses/refreshSyllabus.tool';
import { SubmitEvaluationTool } from './courses/submitEvaluation.tool';
import { GetRulesTool } from './rules/getRules.tool';

/**
 * Home for MCP tool providers. Add new @Tool()-decorated providers here (or
 * in their own feature module) and list them in McpModule.forFeature() so
 * @rekog/mcp-nest's discovery picks them up for the 'diplomka-mcp' server -
 * it only scans providers declared directly on modules that import
 * McpModule (forRoot or forFeature), not arbitrary imported dependencies.
 */
@Module({
  imports: [
    ScraperModule,
    McpModule.forFeature(
      [
        EchoTool,
        GetAllCoursesTool,
        RefreshSyllabusTool,
        SubmitEvaluationTool,
        GetRulesTool,
      ],
      MCP_SERVER_NAME,
    ),
  ],
  providers: [
    EchoTool,
    CoursesService,
    SyllabusService,
    ReportsService,
    RulesService,
    GetAllCoursesTool,
    RefreshSyllabusTool,
    SubmitEvaluationTool,
    GetRulesTool,
  ],
})
export class ToolsModule {}
