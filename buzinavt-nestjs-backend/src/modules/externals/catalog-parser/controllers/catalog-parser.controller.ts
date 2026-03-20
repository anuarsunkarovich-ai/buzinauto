import { Body, Controller, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiGuards } from '@system/externals/decorators/guards/api.guards';
import { SuccessResponse } from '@system/externals/responses/success.response';
import { CatalogParserBrandDto, CatalogParserModelDto } from '../dto/catalog-parser-model.dto';
import { CatalogParserViewServiceV1 } from '../view-services/catalog-parser.view-service';

@ApiTags(`Catalog parser`)
@Controller('catalog/parser')
@ApiGuards()
export class CatalogParserControllerV1 {
  constructor(
    @Inject(CatalogParserViewServiceV1) private readonly _catalogParserViewServiceV1: CatalogParserViewServiceV1
  ) {}

  @Post('/model')
  @ApiResponse({
    type: SuccessResponse,
    status: HttpStatus.OK,
  })
  public async addJobToParsedModel(
    @Body() { brand, model, country, maxPage, ignoreSanction }: CatalogParserModelDto
  ): Promise<SuccessResponse> {
    const result = await this._catalogParserViewServiceV1.addJobToParserCatalog(
      brand,
      model,
      country,
      maxPage,
      ignoreSanction
    );
    return { ok: result };
  }

  @Post('/brand')
  @ApiResponse({
    type: SuccessResponse,
    status: HttpStatus.OK,
  })
  public async addJobToParsedBrand(
    @Body() { brand, country, maxPage, ignoreSanction }: CatalogParserBrandDto
  ): Promise<SuccessResponse> {
    const result = await this._catalogParserViewServiceV1.addManyByBrandParser(brand, country, maxPage, ignoreSanction);
    return { ok: result };
  }
}
