import { AxiosRequestConfig } from 'axios';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Proxy } from '../types/proxy.type';

export class ProxyAgentService {
  public config(proxy: Proxy.Config): AxiosRequestConfig {
    const isExistAuth = proxy.password && proxy.username;
    if (proxy.type === 'HTTP') {
      return {
        proxy: {
          host: proxy.host,
          port: proxy.port,
          auth: isExistAuth
            ? {
                password: proxy.password,
                username: proxy.username,
              }
            : undefined,
          protocol: 'http',
        },
        timeout: 60 * 1000,
      };
    }

    const proxyAgent = (() => {
      if (isExistAuth) {
        return new SocksProxyAgent(`socks://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`);
      }
      return new SocksProxyAgent(`socks://${proxy.host}:${proxy.port}`);
    })();

    return {
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
      timeout: 60 * 1000,
    };
  }

  public toString(proxy: Proxy.Config) {
    const isExistAuth = !!proxy.password && !!proxy.username;

    if (proxy.type === 'SOCKS5') {
      if (isExistAuth) {
        return `socks://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
      }
      return `socks://${proxy.host}:${proxy.port}`;
    }
  }
}
