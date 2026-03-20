import { LoggerService } from '@lib/logger/services/logger.service';
import { InvalidRequestService } from '@lib/request/exceptions/invalid-request.service';
import { Either, left, right } from '@sweet-monads/either';
import { JapanAuctionMapper } from '../mappers/japan-auction.mapper';
import { JapanAuction } from '../types/japan-auction.type';
import { JapanAuctionHelperService } from './japan-auction-helper.service';
import { JapanAuctionRequestService } from './japan-auction-request.service';

export class JapanAuctionClientService {
  private readonly _logger = new LoggerService(JapanAuctionClientService.name);
  private readonly _helper = new JapanAuctionHelperService();
  private readonly _request = new JapanAuctionRequestService();

  public async getManyJapanStat(
    insertData: JapanAuction.FilterAuto
  ): Promise<
    Either<
      InvalidRequestService,
      { docs: JapanAuction.ReadableAuction[] } & Partial<JapanAuction.RawPaginationRepsonse>
    >
  > {
    try {
      const data = (await this._request.getManyJapanStat(insertData)).data;
      const rawData = this._helper.parseScriptResponseSafe(data);
      const body = 'body' in rawData.tpl_poisk ? rawData.tpl_poisk.body : [];

      if (!Array.isArray(body)) {
        return left(new InvalidRequestService());
      }

      const result = body
        .map((item: any) => {
          if (typeof item.a !== 'string' || ('a' in item && !item.a)) {
            return undefined;
          }
          return JapanAuctionMapper.toObject(item);
        })
        .filter((item): item is JapanAuction.ReadableAuction => !!item);

      return right({ docs: result, ...(rawData?.tpl_poisk?.navi || {}) });
    } catch (error) {
      this._logger.error('Fetching auction data', error);
      return left(new InvalidRequestService());
    }
  }

  public async *getAllAutoStat(insertData: Omit<JapanAuction.FilterAuto, 'page'>, startPage = 1) {
    let page = startPage;
    while (true) {
      const ioResult = await this.getManyJapanStat({ ...insertData, page });
      if (ioResult.isLeft()) break;
      const { docs, ...rawPagination } = ioResult.value;

      for (const item of docs) {
        yield Object.assign(item, { page });
      }

      const nextPage = +(rawPagination?.r_arrow || '');

      if (Number.isNaN(nextPage) || nextPage <= 0) {
        break;
      }

      page++;
    }
  }
}
