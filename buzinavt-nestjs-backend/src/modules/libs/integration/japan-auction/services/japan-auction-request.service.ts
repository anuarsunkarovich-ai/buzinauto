import { LoggerService } from '@lib/logger/services/logger.service';
import { ProxyAgentService } from '@lib/proxy/services/proxy-agent.service';
import { RequestService } from '@lib/request/services/request.service';
import { HelperService } from '@system/libs/services/helper.service';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import * as FormData from 'form-data';
import * as iconv from 'iconv-lite';
import { JapanAuctionConfig } from '../config/japan-auction.config';
import { JapanAuction } from '../types/japan-auction.type';

export class JapanAuctionRequestService {
  private readonly _logger = new LoggerService(JapanAuctionRequestService.name);
  private readonly _instance: AxiosInstance;
  private readonly _proxyAgent = new ProxyAgentService();
  private readonly _requestService = new RequestService();

  constructor() {
    this._instance = axios.create({
      baseURL: JapanAuctionConfig.BASE_URL,
      ...this.proxyAgents,
    });
  }

  public async downloadFileByUrlSafe(url: string) {
    return this._requestService.downloadFileByUrlSafe(url, this.proxyAgents);
  }

  public async getManyJapanStat(data: JapanAuction.FilterAuto): Promise<AxiosResponse<string, any>> {
    const form = new FormData();
    form.append('page', data.page.toString());
    form.append('is_stat', Number(data.isStat).toString());
    form.append('vendor', data.brand.toString());
    form.append('model', data.model.toString());
    form.append('stDt1', data.fromDate ? data.fromDate.toISOString().split('T')[0] : '');
    form.append('stDt2', data.toDate ? data.toDate.toISOString().split('T')[0] : '');
    form.append('year', typeof data.fromYear === 'number' ? data.fromYear : '');
    form.append('year2', typeof data.toYear === 'number' ? data.toYear : '');
    form.append('eng_v', typeof data.fromEnginePower === 'number' ? data.fromEnginePower : '');
    form.append('eng_v2', typeof data.toEnginePower === 'number' ? data.toEnginePower : '');
    form.append('_list_size', '');

    const config: AxiosRequestConfig = {
      method: 'POST',
      url: `/${data.country === 'JAPAN' ? 'st' : 'che'}?file=loader&Q=${data.model}&ajx=${Date.now()}-form`,
      data: form,
      headers: {
        ...form.getHeaders(),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      responseType: 'arraybuffer',
    };

    const response = await this._request<string>(config);
    const decodedData = iconv.decode(Buffer.from(response.data), 'win1251');

    return {
      ...response,
      data: decodedData,
    };
  }

  private async _request<T>(
    config: AxiosRequestConfig,
    retryCount = JapanAuctionConfig.RETRY_REQUEST,
    delay = JapanAuctionConfig.RETRY_DELAY
  ): Promise<AxiosResponse<T>> {
    try {
      this._logger.debug(`Send request retryCount => ${retryCount} delay => ${delay}: ${JSON.stringify(config)}`);
      return await this._instance(config);
    } catch (error) {
      if (retryCount <= 0) {
        this._logger.error(`Request failed after retries: ${JSON.stringify(config)}`, error);
        throw error;
      }

      this._logger.debug(
        `Request failed, retrying ${retryCount} more times: ${JSON.stringify(config)}`,
        isAxiosError(error) ? `${error.code} ${error.message}` : error
      );

      await HelperService.sleep(delay);

      return await this._request(config, retryCount - 1, delay * 2);
    }
  }

  public get proxyAgents() {
    const proxyHost = JapanAuctionConfig.PROXY_HOST;
    const proxyPort = JapanAuctionConfig.PROXY_PORT;
    
    if (!proxyHost || !proxyPort) {
      return {};
    }
    
    return this._proxyAgent.config({
      type: 'SOCKS5',
      host: proxyHost,
      port: proxyPort,
      username: JapanAuctionConfig.PROXY_USERNAME,
      password: JapanAuctionConfig.PROXY_PASSWORD,
    });
  }
}
