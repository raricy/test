import * as Joi from 'joi';
import { EnvInterface } from '../../../interfaces/env.interface';

export const validationSchema = Joi.object<EnvInterface, true>({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),

  PORT: Joi.number().default(3000),
  SWAGGER_MOUNT: Joi.string().default(null),

  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  DATABASE_NAME: Joi.string().required(),
});
