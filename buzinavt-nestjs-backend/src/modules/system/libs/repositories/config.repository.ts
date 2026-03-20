import { EnvValidateConfig } from '@app/configurations/env-validate.config';
import { config } from 'dotenv';
config();

export class ConfigRepository {
  public static get<K extends keyof typeof EnvValidateConfig>(key: K, _default?: string): string {
    const value = process.env?.[key] || _default;
    return value as unknown as string;
  }

  public static number(key: keyof typeof EnvValidateConfig, _default?: number): number {
    const value = +process.env?.[key] || _default;
    return value;
  }

  public static boolean(key: keyof typeof EnvValidateConfig, _default: boolean = false): boolean {
    const value = process.env?.[key] || _default;
    return typeof value === 'string' ? value === 'true' : value === true;
  }
}
