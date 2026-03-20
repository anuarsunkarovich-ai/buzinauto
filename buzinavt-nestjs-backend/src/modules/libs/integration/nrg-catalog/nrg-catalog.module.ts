import { RequestModule } from '@lib/request/request.module';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { NrgCatalogClientService } from './services/nrg-catalog-client.service';
import { NrgCatalogRequestService } from './services/nrg-catalog-request.service';

const dependencies: Provider[] = [NrgCatalogRequestService, NrgCatalogClientService];

export const NrgCatalogModuleConfig = {
  imports: [RequestModule],
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(NrgCatalogModuleConfig)
export class NrgCatalogModule {}
