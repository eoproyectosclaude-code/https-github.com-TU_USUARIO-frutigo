import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

async function bootstrap() {
  // rawBody: true permite leer el cuerpo crudo en los webhooks (verificación de firma).
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Cabeceras de seguridad HTTP.
  app.use(helmet());

  // CORS restringido por entorno (CORS_ORIGINS="https://app.frutigo.pa,https://admin...").
  const origins = (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({
    origin: origins.length > 0 ? origins : true,
    credentials: true,
  });

  // Validación estricta: rechaza propiedades desconocidas y transforma tipos.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Respuestas de error consistentes y sin filtración de detalles.
  app.useGlobalFilters(new AllExceptionsFilter());

  // Documentación OpenAPI/Swagger en /docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('FRUTI GO API')
    .setDescription('Plataforma agro-comercial B2B2C de Panamá — catálogo, pagos, entregas, Ship Provisioning.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🍃 FRUTI GO API escuchando en http://localhost:${port}`);
}

bootstrap();
