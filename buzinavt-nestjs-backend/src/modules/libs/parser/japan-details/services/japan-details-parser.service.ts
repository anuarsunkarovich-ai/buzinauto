/* eslint-disable max-len */
import * as useProxy from '@lem0-packages/puppeteer-page-proxy';
import { JapanAuctionConfig } from '@lib/integration/japan-auction/config/japan-auction.config';
import { Browser } from '@lib/parser/browser/services/browser.service';
import { ProxyAgentService } from '@lib/proxy/services/proxy-agent.service';
import { Either, right } from '@sweet-monads/either';
import { ConfigRepository } from '@system/libs/repositories/config.repository';
import { CalcNotAvailableException } from '../exceptions/calc-not-available.exception';
import { JapanDetails } from '../types/japan-details.type';

export class JapanDetailsParserService {
  private readonly _proxyAgentService = new ProxyAgentService();
  private readonly _cookies = [
    {
      name: 'aj_geo',
      value: 'ru',
      domain: this.domain,
    },
    {
      name: 'aj_geo3',
      value: 'ru',
      domain: this.domain,
    },
    {
      name: 'aj_lang',
      value: 'ru',
      domain: this.domain,
    },
    {
      name: 'ajuser',
      value: ConfigRepository.get('JAPAN_AUCTION_USER_LOGIN'),
      domain: this.domain,
    },
  ];

  public async exec(browser: Browser, slug: string): Promise<Either<CalcNotAvailableException, JapanDetails.Result>> {
    return await browser.withPage(
      async (page): Promise<Either<CalcNotAvailableException, JapanDetails.Result>> => {
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
        );
        await page.setRequestInterception(true);

        page.on('request', async (request) => {
          if (request.resourceType() === 'image') {
            request.abort();
          } else {
            await useProxy(request, {
              proxy: this._proxyAgentService.toString({
                type: 'SOCKS5',
                host: JapanAuctionConfig.PROXY_HOST,
                port: JapanAuctionConfig.PROXY_PORT,
                username: JapanAuctionConfig.PROXY_USERNAME,
                password: JapanAuctionConfig.PROXY_PASSWORD,
              }),
            });
          }
        });

        await page.goto(this._url(slug));

        // await page.click('#Fcurr2');

        const data = await page.evaluate((): JapanDetails.Details => {
          const text = (arg0: ChildNode | Element | Element[]) => {
            return Array.isArray(arg0) ? arg0.map((e) => text(e)) : arg0?.textContent?.trim?.() || '';
          };
          const number = (text?: string) => {
            if (typeof text !== 'string') return undefined;
            const result = +(text || '').match(/\d+/g)?.join?.('');
            return Number.isNaN(result) ? undefined : result;
          };

          // document.getElementById('Fcurr2')?.click?.();

          const auctionListImage = document.getElementById('thumb0')?.getAttribute?.('href');
          const mileageKm = number(text(document.querySelectorAll('div[style*="width:95px"] nobr')?.[0]));
          const startPrice = number(text(document.querySelectorAll('td div.aj_price_start nobr')?.[0]));
          const finishPrice = number(text(document.querySelectorAll('td.aj_finish nobr')?.[0]));
          const soldStatus = text(document.querySelectorAll('div[style*="font-size:12px"] nobr')?.[0]);

          const images = [...document.querySelectorAll('#table_main a')]
            .map((e) => e.getAttribute('href'))
            .filter((url) => {
              try {
                new URL(url);
                return true;
              } catch {
                return false;
              }
            });

          eval("vw_reset();aj_display('table_calc',1);");

          const enginePower = number((document.getElementById('VOLUME') as HTMLInputElement)?.value);
          const horsepower = number((document.getElementById('PS') as HTMLInputElement)?.value);

          const input = document.getElementById('PS_el') as HTMLInputElement;
          if (input) {
            input.value = String(horsepower);
            const event = new Event('change', {
              bubbles: true,
              cancelable: true,
            });
            input.dispatchEvent(event);
          }

          const engineChecking: Array<{ id: string; type: JapanDetails.EngineType }> = [
            {
              id: 'fuel_1',
              type: 'gasoline',
            },
            {
              id: 'fuel_2',
              type: 'diesel',
            },
            {
              id: 'fuel_3',
              type: 'electric',
            },
            {
              id: 'fuel_4',
              type: 'hybrid-gasoline',
            },
            {
              id: 'fuel_5',
              type: 'hybrid-diesel',
            },
          ];

          const engineType = engineChecking.find(({ id }) => {
            const radio = document.getElementById(id) as HTMLInputElement;
            return radio?.checked || false;
          })?.type;

          eval('calc_full(1);');

          return {
            auctionList: { image: auctionListImage },
            mileageKm: mileageKm,
            startPrice,
            finishPrice,
            soldStatus,
            images,
            engineType,
            horsepower,
            enginePower,
            rateUSD: (eval('tpl_curr').usd?.[0] || {}) as Record<'cny' | 'eur' | 'rub', number>,
          };
        });

        try {
          await page.waitForSelector('table .total_sum');
        } catch {
          return right({
            ...data,
            duty: { individual: 0, legalEntity: 0 },
            fee: { individual: 0, legalEntity: 0 },
          });
        }

        const dataDuty = await page.evaluate(() => {
          const link = document.querySelector('a[href="http://www.tks.ru/auto/calc"]');
          if (!link) return;

          const event = new MouseEvent('mousemove', {
            bubbles: true,
            cancelable: true,
            view: window,
          });
          link.dispatchEvent(event);

          function parseCustomsData(divSelector: string): JapanDetails.CustomsDuty | null {
            const div = document.querySelector(divSelector);
            if (!div) return null;

            const lines = div.innerHTML
              .replace(/&nbsp;/g, ' ')
              .replace(/&lt;/g, '<')
              .replace(/<br\s*\/?>/gi, '<br>')
              .split('<br>')
              .map((line) => line.replace(/<[^>]+>/g, '').trim())
              .filter((line) => line);

            const result: JapanDetails.CustomsDuty = {
              individual: {
                total: { usd: 0, rub: 0 },
                customs_clearance: 0,
                duty: { usd: 0, rub: 0, rate: '', min_rate: '' },
                recycling_fee: 0,
              },
              legalEntity: {
                total: { usd: 0, rub: 0 },
                customs_clearance: 0,
                duty: { usd: 0, rub: 0, rate: '', min_rate: '' },
                excise: 0,
                vat: 0,
                recycling_fee: 0,
              },
            };

            let currentSection: 'individual' | 'legalEntity' | null = null;

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];

              if (line.match(/физ\.лицо/)) {
                currentSection = 'individual';
                const match = line.match(/физ\.лицо\s+(\d+)\s+USD\s+(\d+)\s+руб/);
                if (match) result.individual.total = { usd: parseInt(match[1]), rub: parseInt(match[2]) };
              } else if (line.match(/юр\.лицо/)) {
                currentSection = 'legalEntity';
                const match = line.match(/юр\.лицо\s+(\d+)\s+USD\s+(\d+)\s+руб/);
                if (match) result.legalEntity.total = { usd: parseInt(match[1]), rub: parseInt(match[2]) };
              } else if (currentSection) {
                if (line.match(/Тамож\.оформл:/)) {
                  const match = line.match(/Тамож\.оформл:\s+(\d+)\s+руб/);
                  if (match) result[currentSection].customs_clearance = parseInt(match[1]);
                } else if (line.match(/Пошлина:/)) {
                  const match = line.match(/Пошлина:\s+(\d+)\s+USD\s+(\d+)\s+руб/);
                  if (match) {
                    const nextLine = lines[i + 1] || '';
                    const rateMatch = nextLine.match(/(\d+%)\s+но\s+не<(.+)/);
                    result[currentSection].duty = {
                      usd: parseInt(match[1]),
                      rub: parseInt(match[2]),
                      rate: rateMatch ? rateMatch[1] : '',
                      min_rate: rateMatch ? rateMatch[2] : '',
                    };
                    i++;
                  }
                } else if (line.match(/утилизационный сбор:/)) {
                  const match = line.match(/утилизационный сбор:\s+(\d+)\s+RUB/);
                  if (match) result[currentSection].recycling_fee = parseInt(match[1]);
                } else if (line.match(/Акциз:/) && currentSection === 'legalEntity') {
                  const match = line.match(/Акциз:\s+(\d+)\s+USD/);
                  if (match) result.legalEntity.excise = parseInt(match[1]);
                } else if (line.match(/НДС:/) && currentSection === 'legalEntity') {
                  const match = line.match(/НДС:\s+(\d+)\s+USD/);
                  if (match) result.legalEntity.vat = parseInt(match[1]);
                }
              }
            }

            if (!result.individual.total.usd || !result.legalEntity.total.usd) return null;

            return result;
          }

          const result = parseCustomsData('.hc12');

          return result;
        });

        const eurRate = parseFloat(String(data?.rateUSD?.eur || 0));

        return right({
          ...data,
          duty: this._duty(dataDuty, eurRate),
          fee: this._fee(dataDuty, eurRate),
        });
      },
      { cookies: this._cookies }
    );
  }

  private _fee(dataDuty: JapanDetails.CustomsDuty, eurRate: number) {
    try {
      const individualFeeEur = (dataDuty.individual.total.usd - dataDuty.individual.duty.usd) / eurRate;
      const legalEntityFeeEur = (dataDuty.legalEntity.total.usd - dataDuty.legalEntity.duty.usd) / eurRate;
      return {
        individual: +individualFeeEur?.toFixed(2),
        legalEntity: +legalEntityFeeEur?.toFixed(2),
      };
    } catch {
      return {
        individual: 0,
        legalEntity: 0,
      };
    }
  }

  private _duty(dataDuty: JapanDetails.CustomsDuty, eurRate: number) {
    try {
      const individualDutyEur = dataDuty.individual.duty.usd / eurRate;
      const legalEntityDutyEur = dataDuty.legalEntity.duty.usd / eurRate;
      return {
        individual: +individualDutyEur?.toFixed(2),
        legalEntity: +legalEntityDutyEur?.toFixed(2),
      };
    } catch {
      return {
        individual: 0,
        legalEntity: 0,
      };
    }
  }

  private _url(slug: string) {
    return `${ConfigRepository.get('JAPAN_AUCTION_BASE_URL')}/${slug}.htm`;
  }

  private get domain() {
    return new URL(ConfigRepository.get('JAPAN_AUCTION_BASE_URL')).host;
  }
}
