import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { CatalogDictionaryControllerV1 } from './controllers/catalog-dictionary.controller';
import { CatalogDictionaryViewServiceV1 } from './view-services/catalog-dictionary.view-service';

const dependencies: Provider[] = [CatalogDictionaryViewServiceV1];

@Module({
  controllers: [CatalogDictionaryControllerV1],
  providers: [...dependencies],
})
export class ExternalCatalogDictionaryModuleV1 {}
