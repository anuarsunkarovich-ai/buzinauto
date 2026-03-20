import { LoggerService } from '@lib/logger/services/logger.service';
import { HelperService } from '@system/libs/services/helper.service';
import { BrowserConfig } from '../config/browser.config';
import { Browser } from './browser.service';

export class BrowserOrchestratorService {
  private _instances: Map<number, Browser> = new Map();
  private _available: Map<number, Browser> = new Map();
  private readonly _logger = new LoggerService(BrowserOrchestratorService.name);
  private readonly _reservedBrowsers = BrowserConfig.MAX_RESERVED;

  constructor() {
    this._initializeBrowsers();
    this._setupShutdownHooks();
  }

  public async waitForAvailable(timeoutMs: number = BrowserConfig.TIMEOUT_GET_AVAILABLE): Promise<Browser | undefined> {
    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < timeoutMs) {
      const browser = this.getAvailable();
      if (browser) {
        return browser;
      }
      await HelperService.sleep(pollInterval);
    }

    this._logger.warn('Timeout waiting for available browser');
    return undefined;
  }

  public getAvailable() {
    if (this._available.size === 0) return;

    const key = this._available.keys().next().value;
    const instance = this._available.get(key);
    this._available.delete(key);
    return instance;
  }

  public return(instance: Browser) {
    this._available.set(instance.index, instance);
  }

  public async shutdown() {
    try {
      const instances = Array.from(this._instances.values());
      const closePromises = instances.map(async (instance) => {
        try {
          return await instance.close();
        } catch (error) {
          this._logger.error(`Error closing browser ${instance.index}:`, error);
        }
      });
      await Promise.all(closePromises);
      this._instances.clear();
      this._available.clear();
    } catch (error) {
      this._logger.error('Error during shutdown:', error);
    }
  }

  private _initializeBrowsers() {
    for (let index = 0; index < this._reservedBrowsers; index++) {
      const instance = new Browser(index);
      this._instances.set(index, instance);
      this._available.set(index, instance);
    }
  }

  private _setupShutdownHooks() {
    process.on('SIGINT', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.shutdown();
      process.exit(0);
    });

    process.on('beforeExit', async () => {
      await this.shutdown();
    });
  }
}
