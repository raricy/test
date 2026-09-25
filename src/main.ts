import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { swaggerConfigure } from './swagger/swagger-configure';
import { ServerConfigInterface } from './interfaces/server-config.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const configService = app.get(ConfigService<ServerConfigInterface>);
  const port = configService.get('port');

  swaggerConfigure(app, {
    auth: true,
    title: 'test users api',
    description: `<h2>Users API</h2>
      <br><a href="/docs-json">JSON schema</a>`,
    mount: configService.get('swagger.mount', { infer: true }),
  });

  await app.listen(port);
  console.log('Users API is running at', port);
}
bootstrap().catch((e) => {
  console.log(e);
  process.exit(1);
});
