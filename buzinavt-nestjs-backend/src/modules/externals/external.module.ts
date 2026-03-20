import { Module } from '@nestjs/common';
import { ExternalCatalogDictionaryModuleV1 } from './catalog-dictionary/external-catalog-dictionary.module';
import { ExternalCatalogParserModuleV1 } from './catalog-parser/external-catalog-parser.module';
import { JapanAuctionExternalModule } from './japan-auction/japan-auction.module';

const modules = [ExternalCatalogDictionaryModuleV1, ExternalCatalogParserModuleV1, JapanAuctionExternalModule];

export const ExternalModuleConfig = {
  imports: [...modules],
  exports: [...modules],
};

@Module(ExternalModuleConfig)
export class ExternalModule {}
