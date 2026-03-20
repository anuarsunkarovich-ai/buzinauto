import * as _ from 'lodash';

export class HelperService {
  public static removeUndefined<R = Record<string, unknown>>(object: R): R {
    return _.pickBy(object, (value) => !_.isUndefined(value) && !_.isNull(value)) as R;
  }
  public static async sleep(ms: number) {
    return await new Promise((resolve) => setTimeout(resolve, ms));
  }
  public static normalizeUrl(url: string): string {
    return url.replace(/([^:]\/)\/+/g, '$1');
  }
  public static getKeyOfStringEnum<T extends Record<string, unknown>>(data: T): Array<keyof T> {
    return Object.keys(data).filter((e) => typeof e === 'string' && isNaN(+e)) as Array<keyof T>;
  }
}
