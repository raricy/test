import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { version } from '../../package.json';
import { SwaggerConfigInterface } from '../interfaces/swagger-config.interface';

export function swaggerConfigure(
  app: INestApplication,
  config: SwaggerConfigInterface,
): void {
  if (!config.mount) {
    return;
  }

  const documentBuilder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion('1.0')
    .setVersion(version);

  if (config.auth) {
    documentBuilder.addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  }

  const swaggerDocument = SwaggerModule.createDocument(
    app,
    documentBuilder.build(),
  );

  SwaggerModule.setup(config.mount, app, swaggerDocument, {
    swaggerOptions: {
      docExpansion: 'none',
      tagsSorter: 'alpha',
      defaultModelRendering: 'model',
      syntaxHighlight: {
        theme: 'tomorrow-night',
      },
    },
  });
}
