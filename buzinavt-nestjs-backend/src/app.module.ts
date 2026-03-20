import { bullConfigModule } from '@app/configurations/bull-config.module';
import { EnvValidateConfig } from '@app/configurations/env-validate.config';
import { IfTrueModule } from '@app/modules/if-true.module';
import { ExternalModule } from '@externals/external.module';
import { LibModule } from '@lib/lib.module';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { LoggerModule } from 'nestjs-pino';
import { PinoConfig } from './app/configurations/pino.config';

@Module({
  imports: [
    ConfigModule.forRoot({ validationSchema: Joi.object(EnvValidateConfig), envFilePath: '.env' }),
    IfTrueModule(process.env.LOGGER_ENABLED_PINO === 'true', LoggerModule.forRoot(PinoConfig)),
    IfTrueModule(
      process.env.RATE_LIMIT_ENABLED === 'true',
      ThrottlerModule.forRoot([
        {
          ttl: +process.env.RATE_LIMIT_APP_TTL,
          limit: +process.env.RATE_LIMIT_APP_LIMIT,
        },
      ])
    ),
    CacheModule.register({ isGlobal: true }),
    MongooseModule.forRoot(process.env.DATABASE_URI),
    BullModule.forRoot(bullConfigModule),
    LibModule,
    ExternalModule,
  ],
})
export class AppModule {}
