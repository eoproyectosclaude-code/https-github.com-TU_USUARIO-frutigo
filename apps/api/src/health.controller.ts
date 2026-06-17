import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: el proceso responde. */
  @Get()
  check() {
    return { status: 'ok', service: 'frutigo-api', ts: new Date().toISOString() };
  }

  /** Readiness: además verifica conectividad con PostgreSQL. */
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', db: 'up', ts: new Date().toISOString() };
    } catch {
      return { status: 'degraded', db: 'down', ts: new Date().toISOString() };
    }
  }
}
