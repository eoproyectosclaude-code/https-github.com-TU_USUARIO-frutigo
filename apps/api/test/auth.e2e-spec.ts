import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Integración de registro/login con Prisma y JWT simulados (sin BD).
 * Verifica la generación del código de referido y la vinculación al referente.
 */
describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let created: any;
  const REFERRER = { id: 'ref-1', referralCode: 'REF12345' };

  const prismaMock = {
    user: {
      findUnique: jest.fn(({ where }: any) => {
        if (where.email) return Promise.resolve(null); // email libre
        if (where.referralCode === REFERRER.referralCode) return Promise.resolve(REFERRER);
        return Promise.resolve(null);
      }),
      create: jest.fn(({ data }: any) => {
        created = { id: 'u1', role: 'COMPRADOR', supplierId: null, ...data };
        return Promise.resolve(created);
      }),
      update: jest.fn(({ data }: any) => Promise.resolve({ ...created, ...data })),
    },
    refreshToken: { create: jest.fn(() => Promise.resolve({})) },
  };
  const jwtMock = { sign: jest.fn(() => 'access-token-demo') };

  beforeEach(async () => {
    created = null;
    Object.values(prismaMock.user).forEach((f: any) => f.mockClear());
    prismaMock.refreshToken.create.mockClear();
    jwtMock.sign.mockClear();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register crea usuario con código de referido propio y tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'nuevo@frutigo.pa', password: 'secreta123', name: 'Joven' })
      .expect(201);

    expect(res.body.accessToken).toBe('access-token-demo');
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.referralCode).toHaveLength(8);
    // sin código de referente → no se vincula ni se da crédito de bienvenida
    const updateArg = prismaMock.user.update.mock.calls[0][0].data;
    expect(updateArg.referredById).toBeNull();
    expect(updateArg.referralCreditUsd).toBe(0);
  });

  it('POST /auth/register con código válido vincula al referente y da $5 de bienvenida', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'referido@frutigo.pa', password: 'secreta123', name: 'Ana', referralCode: 'ref12345' })
      .expect(201);

    const updateArg = prismaMock.user.update.mock.calls[0][0].data;
    expect(updateArg.referredById).toBe(REFERRER.id);
    expect(updateArg.referralCreditUsd).toBe(5);
  });

  it('POST /auth/register rechaza email inválido (validación)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'no-es-email', password: 'secreta123', name: 'X' })
      .expect(400);
  });
});
