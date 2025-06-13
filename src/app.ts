import 'reflect-metadata';
import fastify from 'fastify';
import { container } from './config/inversify.config';
import { HealthController } from './controllers/health.controller';

export const buildServer = () => {
  const server = fastify({ logger: true });
  const healthController = container.get<HealthController>('HealthController');
  server.register(healthController.register.bind(healthController));
  return server;
};
