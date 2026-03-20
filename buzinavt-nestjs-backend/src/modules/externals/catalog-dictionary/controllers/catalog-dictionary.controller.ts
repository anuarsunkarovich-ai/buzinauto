import { JapanAuctionBrand } from '@lib/integration/japan-auction/dictionaries/japan-auction-brand.dictionary';
import { JapanAuctionModelAll } from '@lib/integration/japan-auction/dictionaries/japan-auction-model.dictionary';
import { Controller, Get, HttpStatus, Inject, Param } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiGuards } from '@system/externals/decorators/guards/api.guards';
import { HelperService } from '@system/libs/services/helper.service';
import { CatalogBrandDto } from '../dto/catalog-brand.dto';
import { CatalogDictionaryModelAndBrandResponseV1 } from '../responses/catalog-dictionary.response';
import { CatalogDictionaryViewServiceV1 } from '../view-services/catalog-dictionary.view-service';

@ApiTags(`Car Catalog Dictionary`)
@Controller('catalog/dictionary')
@ApiGuards()
export class CatalogDictionaryControllerV1 {
  constructor(
    @Inject(CatalogDictionaryViewServiceV1)
    private readonly _catalogDictionaryViewServiceV1: CatalogDictionaryViewServiceV1
  ) {}

  @Get()
  @ApiResponse({
    type: CatalogDictionaryModelAndBrandResponseV1,
    status: HttpStatus.OK,
  })
  public async getAllModelAndBrand(): Promise<CatalogDictionaryModelAndBrandResponseV1> {
    return await this._catalogDictionaryViewServiceV1.getAllModelAndBrand();
  }

  @Get('models')
  @ApiResponse({
    type: String,
    status: HttpStatus.OK,
    isArray: true,
  })
  public async getAllModel(): Promise<readonly JapanAuctionModelAll[]> {
    return await this._catalogDictionaryViewServiceV1.getAllModel();
  }

  @Get('brands')
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      type: 'array',
      items: {
        type: 'string',
        enum: HelperService.getKeyOfStringEnum(JapanAuctionBrand),
      },
    },
  })
  public async getAllBrand(): Promise<(keyof typeof JapanAuctionBrand)[]> {
    return await this._catalogDictionaryViewServiceV1.getAllBrand();
  }

  @Get('brands/:brand/models')
  public async getAllModelByBrand(@Param() { brand }: CatalogBrandDto): Promise<string[]> {
    return await this._catalogDictionaryViewServiceV1.getAllModelByBrand(brand);
  }
}
