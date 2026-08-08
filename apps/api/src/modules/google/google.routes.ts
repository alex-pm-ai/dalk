import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../shared/env.js';
import * as service from './google.service.js';

const callbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

/** Pública — redirect de navegador vindo do Google, sem JWT. */
export async function googleCallbackRoutes(app: FastifyInstance) {
  app.get('/callback', async (req, reply) => {
    try {
      const { code, state } = callbackQuerySchema.parse(req.query);
      await service.processarCallback(code, state);
      return reply.redirect(`${env.WEB_ORIGIN}/config?google=conectado`);
    } catch (err) {
      app.log.error(err);
      return reply.redirect(`${env.WEB_ORIGIN}/config?google=erro`);
    }
  });
}

/** Autenticadas — registradas dentro do grupo /app/* (login + assinatura). */
export async function googleRoutes(app: FastifyInstance) {
  app.get('/status', async (req) => service.getStatus(req.usuarioId));

  app.get('/connect', async (req) => ({ url: service.gerarUrlConexao(req.usuarioId) }));

  app.post('/disconnect', async (req, reply) => {
    await service.desconectar(req.usuarioId);
    return reply.code(204).send();
  });
}
