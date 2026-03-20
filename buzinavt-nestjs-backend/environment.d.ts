import { EnvValidateConfig } from '@app/configurations/env-validate.config';

type TEnv = {
  [P in keyof typeof EnvValidateConfig]: (typeof EnvValidateConfig)[P] extends string
    ? (typeof EnvValidateConfig)[P]
    : string;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv extends TEnv {
      PORT: string;
    }
  }
}
