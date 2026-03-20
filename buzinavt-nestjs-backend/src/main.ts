import { HttpStatus, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { MainSwagger } from '@system/externals/documentation/main.swagger';
import { LoggerErrorInterceptor } from 'nestjs-pino';
import { AppModule } from './app.module';

const logger = new Logger('Boostrap');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix(process.env.GLOBAL_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const originList = [/(https|http):\/\/(.*?)/];

  app.enableCors({
    credentials: true,
    origin: originList,
    optionsSuccessStatus: HttpStatus.OK,
  });

  // GENERATE DOCUMENTATION
  const document = SwaggerModule.createDocument(app, MainSwagger);

  if (process.env.SWAGGER_ENABLED === 'true') {
    logger.log(`RUN SWAGGER: http://localhost:${process.env.PORT}/${process.env.SWAGGER_API_URL}`);
    SwaggerModule.setup(process.env.SWAGGER_API_URL, app, document);
  }

  await app.listen(process.env.PORT, () => logger.log(`Server run: http://localhost:${process.env.PORT}`));
}
bootstrap();
