import { EnvValidateConfig } from '@app/configurations/env-validate.config';
import { config } from 'dotenv';
import * as Joi from 'joi';
import { join } from 'path';

config({ path: join(__dirname, '../../../.env') });
const result = Joi.object(EnvValidateConfig).validate(process.env, { allowUnknown: true });

if (result?.error) {
  throw new Error(result.error.message);
}
