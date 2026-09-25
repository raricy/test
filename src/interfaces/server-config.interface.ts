import { SwaggerConfigInterface } from './swagger-config.interface';

export interface ServerConfigInterface {
  env: string;

  port: number;

  swagger: Omit<SwaggerConfigInterface, 'title' | 'description' | 'auth'>;

  db: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
}
