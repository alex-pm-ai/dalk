import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { ZodError } from 'zod';
import { env } from './shared/env.js';
import { AppError } from './shared/errors.js';
import { requireAuth, requireAssinatura } from './shared/auth.middleware.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { billingRoutes, webhookRoutes } from './modules/billing/billing.routes.js';
import { revisoesRoutes } from './modules/revisoes/revisoes.routes.js';
import { simuladosRoutes } from './modules/simulados/simulados.routes.js';
import { tarefasRoutes } from './modules/tarefas/tarefas.routes.js';
import { configRoutes } from './modules/config/config.routes.js';
import { metaRoutes } from './modules/meta/meta.routes.js';
import { googleRoutes, googleCallbackRoutes } from './modules/google/google.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : env.NODE_ENV === 'development' ? { transport: undefined } : true,
  });

  // Error handler central — definido ANTES dos plugins para ser herdado por todos
  // os contextos de rota (no Fastify, o handler só vale para registros posteriores).
  app.setErrorHandler((error: FastifyError, _req, reply) => {
    // Detecção robusta de ZodError (instanceof pode falhar entre instâncias de módulo)
    if (error instanceof ZodError || (error as { name?: string }).name === 'ZodError') {
      return reply.code(400).send({
        error: 'validation_error',
        message: 'Dados inválidos',
        issues: (error as unknown as ZodError).flatten().fieldErrors,
      });
    }
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({ error: error.code, message: error.message });
    }
    if (error.statusCode === 429) {
      return reply.code(429).send({ error: 'rate_limit', message: 'Muitas requisições' });
    }
    app.log.error(error);
    return reply.code(500).send({ error: 'internal_error', message: 'Erro interno' });
  });

  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  if (env.NODE_ENV !== 'test') {
    await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  }

  // Healthcheck
  app.get('/health', async () => ({ status: 'ok' }));

  // Auth — sem gate de assinatura
  await app.register(authRoutes, { prefix: '/auth' });

  // Billing — autenticado, mas sem gate (precisa entrar aqui para pagar)
  await app.register(billingRoutes, { prefix: '/billing' });

  // Webhook do provedor — público (validação por HMAC dentro do gateway)
  await app.register(webhookRoutes, { prefix: '/billing' });

  // Callback do OAuth do Google — público (redirect de navegador, sem JWT)
  await app.register(googleCallbackRoutes, { prefix: '/google' });

  // ── Rotas de CONTEÚDO protegidas pelo gate de assinatura ──
  await app.register(
    async (content) => {
      // Todo o grupo exige login + assinatura ativa
      content.addHook('preHandler', requireAuth);
      content.addHook('preHandler', requireAssinatura);

      content.get('/ping', async () => ({
        ok: true,
        msg: 'Você está autenticado E com assinatura ativa.',
      }));

      await content.register(revisoesRoutes, { prefix: '/revisoes' });
      await content.register(simuladosRoutes, { prefix: '/simulados' });
      await content.register(tarefasRoutes, { prefix: '/tarefas' });
      await content.register(configRoutes, { prefix: '/config' });
      await content.register(metaRoutes, { prefix: '/meta' });
      await content.register(googleRoutes, { prefix: '/google' });
    },
    { prefix: '/app' }
  );

  return app;
}
