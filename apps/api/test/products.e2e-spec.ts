import { Test, type TestingModule } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ProductsController } from '../src/products/products.controller';
import { ProductsService } from '../src/products/products.service';

/**
 * Integración del catálogo con un ProductsService simulado (sin BD).
 * Verifica el listado, el filtro por categoría y el 404 de detalle.
 */
describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  const serviceMock = {
    findAll: jest.fn(),
    recommended: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    Object.values(serviceMock).forEach((fn) => fn.mockReset());
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: serviceMock }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /products devuelve el listado', async () => {
    serviceMock.findAll.mockResolvedValueOnce([{ id: 'p1', nameEs: 'Tomate' }]);
    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nameEs).toBe('Tomate');
    expect(serviceMock.findAll).toHaveBeenCalledWith(undefined);
  });

  it('GET /products?category=FRUTAS pasa el filtro al servicio', async () => {
    serviceMock.findAll.mockResolvedValueOnce([]);
    await request(app.getHttpServer()).get('/products?category=FRUTAS').expect(200);
    expect(serviceMock.findAll).toHaveBeenCalledWith('FRUTAS');
  });

  it('GET /products/:id inexistente responde 404', async () => {
    serviceMock.findOne.mockResolvedValueOnce(null);
    const res = await request(app.getHttpServer()).get('/products/nope').expect(404);
    expect(res.body.message).toContain('no encontrado');
  });
});
