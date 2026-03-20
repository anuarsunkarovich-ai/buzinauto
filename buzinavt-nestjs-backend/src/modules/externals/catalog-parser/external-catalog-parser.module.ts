import { CrawlerModule } from '@lib/parser/crawler/crawler.module';
import { ParserJapanAuctionModule } from '@lib/parser/japan-auction/parser-japan-auction.module';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { CatalogParserControllerV1 } from './controllers/catalog-parser.controller';
import { CatalogParserViewServiceV1 } from './view-services/catalog-parser.view-service';

const dependencies: Provider[] = [CatalogParserViewServiceV1];

@Module({
  imports: [ParserJapanAuctionModule, CrawlerModule],
  controllers: [CatalogParserControllerV1],
  providers: [...dependencies],
})
export class ExternalCatalogParserModuleV1 {}
