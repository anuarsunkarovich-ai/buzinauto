import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { RequestService } from './services/request.service';

const dependencies: Provider[] = [RequestService];

export const RequestModuleConfig = {
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(RequestModuleConfig)
export class RequestModule {}
