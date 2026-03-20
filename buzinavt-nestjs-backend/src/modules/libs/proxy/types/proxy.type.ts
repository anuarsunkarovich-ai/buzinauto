export namespace Proxy {
  export interface Config {
    type: 'HTTP' | 'SOCKS5';
    host: string;
    port: number;

    password?: string;
    username?: string;
  }
}
