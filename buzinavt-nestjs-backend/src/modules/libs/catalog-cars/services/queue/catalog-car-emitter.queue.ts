import { CatalogCarConfig } from '@lib/catalog-cars/catalog-cars/catalog-cars.config';
import { JapanAuction } from '@lib/integration/japan-auction/types/japan-auction.type';
import { LoggerService } from '@lib/logger/services/logger.service';
import { CrawlerListPageQueuePayload } from '@lib/parser/crawler/services/queue/crawler-emitter.service';
import { JapanDetails } from '@lib/parser/japan-details/types/japan-details.type';

import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';

export const CatalogCarQueueAlias = 'catalog-car';

export type CatalogCarQueuePayload =
  | {
      source: 'JAPAN_AUCTION_LIST';
      data: JapanAuction.ReadableAuction;
      inputData: CrawlerListPageQueuePayload;
    }
  | {
      source: 'JAPAN_AUCTION_DETAILS';
      externalId: string;
      data: JapanDetails.Result;
    };

export class CatalogCarEmitterServiceQueue {
  private readonly _logger = new LoggerService(CatalogCarEmitterServiceQueue.name);

  constructor(@InjectQueue(CatalogCarQueueAlias) private readonly _queue: Queue<CatalogCarQueuePayload>) {
    // +(async () => {
    //   const failedJobs = await _queue.getFailed();
    //   for (const job of failedJobs) {
    //     await job.retry(); // Перезапускаем задачу
    //     console.log(`Job ${job.id} retried without delay`);
    //   }
    // })();
  }

  async emit(data: CatalogCarQueuePayload, opts: JobsOptions = {}) {
    this._logger.debug(`Emit new queue data => ${JSON.stringify(data)}`);
    return await this._queue.add('default', data, this._mapOpts(opts));
  }

  public async batch(items: CatalogCarQueuePayload[], opts: JobsOptions = {}) {
    this._logger.debug(`Emits new queue data => ${JSON.stringify(items)}`);
    return await this._queue.addBulk(
      items.map((data) => ({
        name: 'default',
        data: data,
        opts: this._mapOpts(opts),
      }))
    );
  }

  private _mapOpts(opts: JobsOptions = {}) {
    return {
      attempts: CatalogCarConfig.QUEUE_MAX_ATTEMPTS_JOBS,
      backoff: {
        type: 'fixed',
        delay: CatalogCarConfig.QUEUE_RETRY_DELAY,
      },
      ...opts,
    };
  }
}
