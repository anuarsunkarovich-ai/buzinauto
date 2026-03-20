import { JapanAuction } from '@lib/integration/japan-auction/types/japan-auction.type';
import { NrgCatalogClientService } from '@lib/integration/nrg-catalog/services/nrg-catalog-client.service';
import { NrgCatalog } from '@lib/integration/nrg-catalog/types/nrg-catalog.type';
import { LoggerService } from '@lib/logger/services/logger.service';
import { CrawlerListPageQueuePayload } from '@lib/parser/crawler/services/queue/crawler-emitter.service';
import { JapanDetails } from '@lib/parser/japan-details/types/japan-details.type';
import { InvalidRequestService } from '@lib/request/exceptions/invalid-request.service';
import { Inject } from '@nestjs/common';
import { Either, left } from '@sweet-monads/either';
import { CarDoesFitException } from '../exceptions/car-does-fit.exception';
import { CarDoesNotContainPhotoException } from '../exceptions/car-does-not-contain-photo.exception';
import { CarUploadMediaFailedException } from '../exceptions/car-upload-media-failed.exception';
import { CatalogCarsMapper } from '../mapper/catalog-cars.mapper';

export class CarToCatalogService {
  private readonly _logger = new LoggerService(CarToCatalogService.name);
  constructor(@Inject(NrgCatalogClientService) private readonly _nrgCatalogClientService: NrgCatalogClientService) {}

  public async updateDetails(
    externalId: string,
    data: JapanDetails.Result
  ): Promise<
    Either<
      CarDoesNotContainPhotoException | InvalidRequestService | CarDoesFitException | CarUploadMediaFailedException,
      NrgCatalog.BaseDocResponse
    >
  > {
    if (!Array.isArray(data.images) || data.images.length === 0) {
      return left(new CarDoesNotContainPhotoException());
    }

    const ioCar = await this._nrgCatalogClientService.getOneByExternalId(externalId);
    if (ioCar.isLeft()) return left(ioCar.value);
    const car = ioCar.value;

    const auctionListId = await (async () => {
      if (data?.auctionList?.image) {
        const ioResult = await this._nrgCatalogClientService.uploadCatalogMediaByUrl(
          data.auctionList.image,
          `${car.brand} ${car.modelDisplay} ${car.year}г. аукционный лист`
        );
        return ioResult.isRight() ? ioResult.value.doc.id : undefined;
      }
      return undefined;
    })();

    const result = await Promise.all(
      data.images.map(async (url, i) => {
        const ioResult = await this._nrgCatalogClientService.uploadCatalogMediaByUrl(
          url,
          this._alt(car.brand, car.modelDisplay, car.year, car.lot, i)
        );
        return ioResult;
      })
    );

    if (result.every((e) => e.isLeft())) {
      return left(new CarUploadMediaFailedException());
    }

    const rightPhotos = result.filter((e) => e.isRight()).map((e) => e.value) as NrgCatalog.BaseDocResponse[];

    return await this._nrgCatalogClientService.updateCarCatalog(externalId, {
      images: rightPhotos.map((e) => e.doc.id),
      auctionList: auctionListId,
      mileageKm: data.mileageKm,
      horsepower: data.horsepower,
      enginePower: data.enginePower,
      engineType: data.engineType,
      price: {
        start: data.startPrice,
        final: data.finishPrice,
      },
      customsDuty: {
        individual: data.duty.individual,
        legalEntity: data.duty.legalEntity,
      },
      disposalFee: {
        individual: data.fee.individual,
        legalEntity: data.fee.legalEntity,
      },
      isFinish: true,
    });
  }

  public async create(
    data: JapanAuction.ReadableAuction,
    filter: CrawlerListPageQueuePayload
  ): Promise<
    Either<
      CarDoesNotContainPhotoException | InvalidRequestService | CarDoesFitException | CarUploadMediaFailedException,
      NrgCatalog.BaseDocResponse
    >
  > {
    if (data.isSanctions && !filter.ignoreSanction) {
      return left(new CarDoesFitException());
    }

    const isPriceFilter = data.prefix === 'st' && !filter.ignoreSanction;

    if (
      (!data.averagePrice && !data.finalPriceYen && isPriceFilter) ||
      (!data.averagePrice && data.finalPriceYen && data.isSold === false && isPriceFilter)
    ) {
      return left(new CarDoesFitException());
    }

    if (!Array.isArray(data.imageIds) || data.imageIds.length === 0) {
      return left(new CarDoesNotContainPhotoException());
    }

    return await this._nrgCatalogClientService.createCarToCatalog(await CatalogCarsMapper.toNrgCatalog(data, filter, []));
  }

  private _alt(brand: string, model: string, year: number, lot: number, index?: number) {
    const text = `${brand} ${model}, ${year} год., лот ${lot}`;
    return index ? text + ` - фото ${index + 1}` : text;
  }
}
