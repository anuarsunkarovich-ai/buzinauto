import { Module } from '@nestjs/common';
import { BrowserOrchestratorService } from './services/browser-orchestrator.service';

const dependencies = [BrowserOrchestratorService];

export const BrowserModuleConfig = {
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(BrowserModuleConfig)
export class BrowserModule {}
