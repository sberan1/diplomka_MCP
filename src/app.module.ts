import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { McpModule, McpTransportType } from '@rekog/mcp-nest';
import { ToolsModule } from './tools/tools.module';
import { DatabaseModule } from './database';
import { MCP_SERVER_NAME, MCP_SERVER_VERSION } from './mcp-server.config';
import { CronsModule } from './crons/crons.module';
import { CoursesModule } from './courses/courses.module';
import { BearerAuthMiddleware } from './auth/bearer-auth.middleware';

const isStdio = process.env.MCP_TRANSPORT === 'stdio';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    McpModule.forRoot({
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
      // main.ts (HTTP) and main.stdio.ts share this module but need
      // different transports active - MCP_TRANSPORT picks between them.
      transport: isStdio
        ? [McpTransportType.STDIO]
        : [McpTransportType.STREAMABLE_HTTP],
      // stdout is reserved for MCP protocol framing in stdio mode.
      logging: isStdio ? false : undefined,
    }),
    ToolsModule,
    CronsModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Applied as middleware, not McpModule.forRoot's `guards` option - see
    // BearerAuthMiddleware's docstring for why. No-op under stdio (no HTTP
    // server, no 'mcp' route).
    consumer.apply(BearerAuthMiddleware).forRoutes('mcp');
  }
}
