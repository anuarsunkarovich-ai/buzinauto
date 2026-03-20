import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { JapanDetailsParserService } from './services/japan-details-parser.service';

const dependencies: Provider[] = [JapanDetailsParserService];

export const JapanDetailsModuleConfig = {
  imports: [],
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(JapanDetailsModuleConfig)
export class JapanDetailsModule {}
