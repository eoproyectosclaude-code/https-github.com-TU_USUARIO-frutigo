import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { HealthController } from '../src/health.controller';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Integración del HealthController con un PrismaService simulado (sin BD real).
 * Verifica liveness, readiness OK (200) y readiness degradado (503).
 */
describe('HealthController (e2e)', () => {
  let app: INestApplication;
  const prismaMock = { $queryRaw: jest.fn() };

  async function buildApp() {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    const application = moduleRef.createNestApplication();
    await application.init();
    return application;
  }

  beforeEach(async () => {
    prismaMock.$queryRaw.mockReset();
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health responde liveness con versión y uptime', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('frutigo-api');
    expect(res.body).toHaveProperty('version');
    expect(typeof res.body.uptimeSec).toBe('number');
  });

  it('GET /health/ready responde 200 cuando la BD está arriba', async () => {
    prismaMock.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
    const res = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.db.status).toBe('up');
    expect(typeof res.body.db.latencyMs).toBe('number');
  });

  it('GET /health/ready responde 503 cuando la BD no responde', async () => {
    prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app.getHttpServer()).get('/health/ready').expect(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db.status).toBe('down');
  });
});
