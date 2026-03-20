import { DocumentBuilder } from '@nestjs/swagger';

export const MainSwagger = new DocumentBuilder()
  .setTitle('Nrg Auto Api')
  .setDescription('The Nrg Auto API description')
  .setVersion('1.1')
  .build();
