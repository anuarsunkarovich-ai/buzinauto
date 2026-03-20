import { BullRootModuleOptions } from '@nestjs/bullmq';
import { ConfigRepository } from '@system/libs/repositories/config.repository';
import { config } from 'dotenv';
import { redisConfig } from './redis-config.module';
config();

export const bullConfigModule: BullRootModuleOptions = {
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    keepLogs: 0,
    stackTraceLimit: 0,
  },
  connection: redisConfig,
  prefix: ConfigRepository.get('QUEUE_PREFIX_DEFAULT', 'nrg-aut'),
};
