import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../shared/prisma.js';
import { ConflictError, NotFoundError } from '../../shared/errors.js';

const criarSchema = z.object({
  grandeArea: z.string().min(1),
  subArea: z.string().min(1).max(120),
});

/** Erro do Prisma para violação de constraint única (@@unique). */
function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string })?.code === 'P2002';
}

export async function conteudosRoutes(app: FastifyInstance) {
  app.get('/', async (req) =>
    prisma.conteudo.findMany({
      where: { usuarioId: req.usuarioId },
      orderBy: [{ grandeArea: 'asc' }, { subArea: 'asc' }],
    })
  );

  app.post('/', async (req, reply) => {
    const { grandeArea, subArea } = criarSchema.parse(req.body);
    try {
      const conteudo = await prisma.conteudo.create({
        data: { usuarioId: req.usuarioId, grandeArea, subArea: subArea.trim() },
      });
      return reply.code(201).send(conteudo);
    } catch (err) {
      // O @@unique do banco é quem garante isso; traduzimos para um 409 legível.
      if (isUniqueViolation(err)) throw new ConflictError('Você já cadastrou esse conteúdo nessa área');
      throw err;
    }
  });

  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const r = await prisma.conteudo.deleteMany({ where: { id, usuarioId: req.usuarioId } });
    if (r.count === 0) throw new NotFoundError('Conteúdo não encontrado');
    return reply.code(204).send();
  });
}
