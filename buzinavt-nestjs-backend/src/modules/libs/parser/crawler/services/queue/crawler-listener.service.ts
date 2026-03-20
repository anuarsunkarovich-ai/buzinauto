import { CatalogCarEmitterServiceQueue } from '@lib/catalog-cars/services/queue/catalog-car-emitter.queue';
import { LoggerService } from '@lib/logger/services/logger.service';
import { BrowserOrchestratorService } from '@lib/parser/browser/services/browser-orchestrator.service';
import { JapanAuctionParserService } from '@lib/parser/japan-auction/services/japan-auction-parser.service';
import { CalcNotAvailableException } from '@lib/parser/japan-details/exceptions/calc-not-available.exception';
import { JapanDetailsParserService } from '@lib/parser/japan-details/services/japan-details-parser.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CrawlerConfig } from '../../config/crawler.config';
import { CrawlerQueueAlias, CrawlerQueuePayload } from './crawler-emitter.service';

@Processor(CrawlerQueueAlias, {
  concurrency: CrawlerConfig.QUEUE_CONCURRENCY,
})
export class CrawlerListenerQueueService extends WorkerHost {
  private readonly _logger = new LoggerService(CrawlerListenerQueueService.name);

  constructor(
    @Inject(BrowserOrchestratorService) private readonly _browserOrchestratorService: BrowserOrchestratorService,
    @Inject(JapanAuctionParserService) private readonly _japanAuctionParserService: JapanAuctionParserService,
    @Inject(JapanDetailsParserService) private readonly _japanDetailsParserService: JapanDetailsParserService,
    @Inject(CatalogCarEmitterServiceQueue)
    private readonly _catalogCarEmitterServiceQueue: CatalogCarEmitterServiceQueue
  ) {
    super();
  }

  async process(job: Job<CrawlerQueuePayload>): Promise<any> {
    try {
      const data = job.data;

      if (data.action === 'LIST_PAGE') {
        const progress = Number(job.progress) || 1;

        for await (const page of this._japanAuctionParserService.handlerJob(
          data,
          Number.isNaN(progress) ? 1 : progress,
          data.maxPage
        )) {
          await job.updateProgress(page);
        }
      }

      const browser = await this._browserOrchestratorService.waitForAvailable();
      try {
        if (!browser) throw new Error('Not available browser');
        if (data.action === 'DETAILS') {
          const ioResult = await this._japanDetailsParserService.exec(browser, data.slug);
          if (ioResult.isRight()) {
            await this._catalogCarEmitterServiceQueue.emit({
              source: 'JAPAN_AUCTION_DETAILS',
              externalId: data.slug,
              data: ioResult.value,
            });
          } else if (ioResult.value instanceof CalcNotAvailableException) {
            this._logger.fatal(`Calc noy available ${data.slug}`);
          }
        }
      } catch (error) {
        console.log(error, job.data);
        throw error;
      } finally {
        this._browserOrchestratorService.return(browser);
      }
    } catch (e) {
      this._logger.error(e.message, e.stack);
      throw e;
    }
  }
}
