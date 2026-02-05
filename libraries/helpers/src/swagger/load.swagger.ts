import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication, Logger } from '@nestjs/common';

export const loadSwagger = (app: INestApplication) => {
  // Only load Swagger in development to improve startup time in production
  if (process.env.NODE_ENV === 'production') {
    Logger.log('Swagger disabled in production for faster startup', 'Swagger');
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('AXON Swagger file')
    .setDescription('API description')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  Logger.log('Swagger docs available at /docs', 'Swagger');
};
