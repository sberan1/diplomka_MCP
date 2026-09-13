import {
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';

/**
 * Protects the MCP HTTP transport (streamable-http) with a single shared
 * bearer token from MCP_AUTH_TOKEN. Applied as middleware (AppModule.
 * configure()) rather than as a Guard passed to McpModule.forRoot({ guards
 * }) deliberately: @rekog/mcp-nest stamps every tool's advertised
 * securitySchemes as oauth2 the moment *any* guard is configured there
 * (ToolAuthorizationService.generateSecuritySchemes - it has no concept of
 * a plain bearer/API-key scheme), which sends OAuth-aware clients into a
 * discovery flow this server doesn't implement. Middleware sits outside
 * that guard-detection entirely, so tools/list correctly reports "noauth"
 * while this still enforces the token on every request.
 */
@Injectable()
export class BearerAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BearerAuthMiddleware.name);

  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const expectedToken = this.configService.get<string>('MCP_AUTH_TOKEN');
    if (!expectedToken) {
      this.logger.error(
        'MCP_AUTH_TOKEN is not set - refusing all MCP requests until it is configured.',
      );
      throw new UnauthorizedException('Server auth is not configured');
    }

    const header = req.headers.authorization;
    const presentedToken = header?.startsWith('Bearer ')
      ? header.slice('Bearer '.length)
      : undefined;

    if (!presentedToken || !this.tokensMatch(presentedToken, expectedToken)) {
      throw new UnauthorizedException('Invalid or missing bearer token');
    }

    next();
  }

  private tokensMatch(presented: string, expected: string): boolean {
    const presentedBuf = Buffer.from(presented);
    const expectedBuf = Buffer.from(expected);
    // Lengths are compared up front (not constant-time) purely to satisfy
    // timingSafeEqual's equal-length requirement; only leaks token length.
    if (presentedBuf.length !== expectedBuf.length) return false;
    return timingSafeEqual(presentedBuf, expectedBuf);
  }
}
