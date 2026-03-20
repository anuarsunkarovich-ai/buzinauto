import { JapanAuctionBrand } from '@lib/integration/japan-auction/dictionaries/japan-auction-brand.dictionary';
import { JapanAuction } from '@lib/integration/japan-auction/types/japan-auction.type';
import { NrgCatalog } from '@lib/integration/nrg-catalog/types/nrg-catalog.type';
import { LoggerService } from '@lib/logger/services/logger.service';
import { CrawlerListPageQueuePayload } from '@lib/parser/crawler/services/queue/crawler-emitter.service';
import { ColorNormalizerService } from '../services/normalizes/color-normalize.service';
import { DrivetrainNormalizer } from '../services/normalizes/drivetrain.normalizer.service';
import { ModelNormalizeService } from '../services/normalizes/model-normalize.service';
import { SaleStatusNormalizerService } from '../services/normalizes/sale-status-normalize.service';
import { TransmissionNormalizerService } from '../services/normalizes/transmission-normalize.service';
import axios from 'axios';

export class CatalogCarsMapper {
  private static readonly _logger = new LoggerService(CatalogCarsMapper.name);
  private static readonly _colorNormalizer = new ColorNormalizerService();
  private static readonly _saleStatusNormalizerService = new SaleStatusNormalizerService();
  private static readonly _transmissionNormalizerService = new TransmissionNormalizerService();
  private static readonly _drivetrainNormalizer = new DrivetrainNormalizer();

  // <-- CONVERTED TO ASYNC
  public static async toNrgCatalog(
    data: JapanAuction.ReadableAuction,
    filter: CrawlerListPageQueuePayload,
    imagesIds: string[]
  ): Promise<NrgCatalog.CarCatalogRequestEntity> {
    try {
      const parsedDate = (() => {
        if (data.time && data.date) {
          return Date.parse(data.date.split('.').reverse().join('-') + `T${data.time}`);
        }
        if (data.date) {
          return Date.parse(data.date.split('.').reverse().join('-'));
        }
        return Date.now();
      })();

      const model = filter.model.toString();
      const currency = data.prefix === 'st' ? 'JPY' : 'CNY';

      // --- INJECTED: TKS Age Calculation ---
      const currentYear = new Date().getFullYear(); // 2026
      const age = currentYear - (data.year || currentYear);
      let ageCategory = '3-5';
      if (age < 3) ageCategory = '0-3';
      else if (age >= 3 && age < 5) ageCategory = '3-5';
      else if (age >= 5 && age < 7) ageCategory = '5-7';
      else ageCategory = '7-0';

      // --- INJECTED: FastAPI Microservice Call ---
      let totalRub = 0;
      let breakdown = null;

      // Only calculate if it's a Japanese auction and we have a price
      const baseJpy = data.finalPriceYen || data.startingPriceYen || 0;
      
      if (currency === 'JPY' && baseJpy > 0) {
        try {
          const calcResponse = await axios.post('http://localhost:8000/api/v1/calculate', {
            price_jpy: baseJpy,
            engine_cc: data.enginePower || 1500, // Fallback if missing
            power_hp: data.horsepower || 110,    // Fallback if missing
            age_category: ageCategory
          });

          if (calcResponse.data.status === 'success') {
            totalRub = calcResponse.data.total_rub;
            breakdown = calcResponse.data.breakdown;
          }
        } catch (e) {
          CatalogCarsMapper._logger.error('FastAPI Calculation failed', e);
        }
      }

      return {
        images: imagesIds,
        externalId: `${data.prefix}-${data.id}`,
        lot: parseInt(data.lotNumber),
        auction: (data.auctionName || '').replace('/', ' ').trim(),
        model: model,
        modelDisplay: ModelNormalizeService.toDisplay(model),
        modelSlug: ModelNormalizeService.toSlug(model),
        brand: JapanAuctionBrand[filter.brand],
        body: data.body,
        year: data.year,
        transmission: CatalogCarsMapper._transmissionNormalizerService.normalize(data.transmission),
        horsepower: data.horsepower,
        enginePower: data.enginePower,
        driveType: CatalogCarsMapper._drivetrainNormalizer.normalizePrimary(data.driveType),
        rating: data.rating,
        price: {
          start: data.startingPriceYen,
          avg: data.averagePrice,
          avgList: data.averagePriceArray,
          currency: currency,
          final: data.finalPriceYen,
          // --- INJECTED: New Data ---
          finalRub: totalRub,     
          breakdown: breakdown    
        },
        mileageKm: data.mileageKm,
        date: new Date(parsedDate).toISOString(),
        color: CatalogCarsMapper._colorNormalizer.normalize(data.color),
        saleStatus: CatalogCarsMapper._saleStatusNormalizerService.normalize(data.soldStatus),
        isSold: data.isSold,
        isSanctions: data.isSanctions,
        saleCountry: filter.country,
      };
    } catch (error) {
      CatalogCarsMapper._logger.error(data, filter, error);
      throw error;
    }
  }
}
