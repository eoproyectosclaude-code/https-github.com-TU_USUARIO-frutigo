import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';

const VERSION = process.env.APP_VERSION ?? '0.1.0';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /** Liveness: el proceso responde. Siempre 200 mientras el event loop viva. */
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'frutigo-api',
      version: VERSION,
      uptimeSec: Math.round(process.uptime()),
      ts: new Date().toISOString(),
    };
  }

  /**
   * Readiness: verifica conectividad con PostgreSQL y mide la latencia.
   * Devuelve 200 si está listo o 503 si la BD no responde (para balanceadores/k8s).
   */
  @Get('ready')
  async ready(@Res() res: Response) {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(HttpStatus.OK).json({
        status: 'ready',
        db: { status: 'up', latencyMs: Date.now() - start },
        version: VERSION,
        uptimeSec: Math.round(process.uptime()),
        ts: new Date().toISOString(),
      });
    } catch (e) {
      return res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'degraded',
        db: { status: 'down', error: (e as Error).message },
        version: VERSION,
        ts: new Date().toISOString(),
      });
    }
  }
}
