import { CatalogCarEmitterServiceQueue } from '@lib/catalog-cars/services/queue/catalog-car-emitter.queue';
import { JapanAuctionClientService } from '@lib/integration/japan-auction/services/japan-auction-client.service';
import { JapanAuction } from '@lib/integration/japan-auction/types/japan-auction.type';
import { Inject } from '@nestjs/common';
import { BatchSizeService } from '@system/libs/services/batch-size.service';

export class JapanAuctionParserService {
  constructor(
    @Inject(JapanAuctionClientService) private readonly _japanAuctionClientService: JapanAuctionClientService,
    @Inject(CatalogCarEmitterServiceQueue)
    private readonly _catalogCarEmitterServiceQueue: CatalogCarEmitterServiceQueue
  ) {}

  public async *handlerJob(
    data: Omit<JapanAuction.FilterAuto, 'page'>,
    startPage: number = 1,
    maxPage: number = 1
  ): AsyncGenerator<number> {
    const cursor = this._japanAuctionClientService.getAllAutoStat(data, startPage);
    let lastSyncPage = startPage;
    const batch = new BatchSizeService<JapanAuction.ReadableAuction>(20);

    batch.on(async (items) => {
      await this._catalogCarEmitterServiceQueue.batch(
        items.map((item) => {
          return {
            data: item,
            source: 'JAPAN_AUCTION_LIST',
            inputData: { action: 'LIST_PAGE', ...data, toEnginePower: 2000 },
          };
        })
      );
    });

    for await (const item of cursor) {
      if (item.page !== lastSyncPage) {
        yield lastSyncPage;
        lastSyncPage = item.page;
      }
      await batch.next(item);
      if (item.page > maxPage) {
        yield item.page;
        break;
      }
    }

    await batch.end();
  }
}
