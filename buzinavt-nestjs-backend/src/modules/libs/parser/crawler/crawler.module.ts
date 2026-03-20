import { Module } from '@nestjs/common';
import { CrawlerQueueServicesModule } from './modules/crawler-queue-services.module';
import { CrawlerServicesModule } from './modules/crawler-services.module';

const modules = [CrawlerQueueServicesModule, CrawlerServicesModule];

export const CrawlerModuleConfig = {
  imports: [...modules],
  exports: [...modules],
};

@Module(CrawlerModuleConfig)
export class CrawlerModule {}
