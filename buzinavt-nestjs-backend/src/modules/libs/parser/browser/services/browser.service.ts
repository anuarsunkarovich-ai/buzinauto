import { LoggerService } from '@lib/logger/services/logger.service';
import puppeteer, { Browser as B, CookieData, Page } from 'puppeteer';

type PageOptions = {
  cookies: CookieData[];
};

export class Browser {
  private readonly _logger = new LoggerService(Browser.name);

  private _instancePromise: Promise<B> | B;

  constructor(private readonly _index: number) {
    this._instancePromise = puppeteer.launch({
      headless: true,
      // headless: process.env.NODE_ENV === 'production',
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });
  }

  public async getInstance() {
    if (this._instancePromise instanceof Promise) {
      const instance = await this._instancePromise;
      this._instancePromise = instance;
      return instance;
    }
    return this._instancePromise;
  }

  public get index(): number {
    return this._index;
  }

  public async close() {
    await (await this.getInstance()).close();
    this._instancePromise = undefined;
  }

  public async withPage<T>(callback: (page: Page) => Promise<T>, options?: PageOptions): Promise<T> {
    const browser = await this.getInstance();
    let page: Page | undefined;
    const { cookies } = options;

    if (cookies && Array.isArray(cookies) && cookies.length) {
      browser.setCookie(...cookies);
    }

    try {
      page = await browser.newPage();
      return await callback(page);
    } catch (error) {
      if (error instanceof Error) {
        this._logger.error(`Page operation failed for browser ${this._index}: ${error.message}`, error.stack);
      }
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (closeError) {
          if (closeError instanceof Error) {
            this._logger.warn(
              `Failed to close page for browser ${this._index}: ${closeError.message}`,
              closeError.stack
            );
          }
        }
      }
    }
  }
}
