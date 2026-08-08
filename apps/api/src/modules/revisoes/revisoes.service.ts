import { prisma } from '../../shared/prisma.js';
import { NotFoundError } from '../../shared/errors.js';
import { calcularAproveitamento, calcularProximaRevisao, DEFAULT_FAIXAS, type Faixa } from '../../domain/algoritmo.js';
import { today, daysFromNow, isPast } from '../../domain/date.js';
import * as googleCalendar from '../google/google.service.js';

export interface CriarRevisaoInput {
  tipo: string;
  grandeArea: string;
  subArea: string;
  dataRevisao: string;
  tempoEstudo: number;
  questoesFeitas: number;
  questoesAcertadas: number;
  aproveitamento: number;
  status: string;
  proximaRevisao: string | null;
  gerarRevisaoInteligente: boolean;
}

async function getFaixas(usuarioId: string): Promise<Faixa[]> {
  const cfg = await prisma.configAlgoritmo.findUnique({ where: { usuarioId } });
  return (cfg?.faixas as unknown as Faixa[]) ?? DEFAULT_FAIXAS;
}

export function listar(usuarioId: string) {
  return prisma.revisao.findMany({
    where: { usuarioId },
    orderBy: { dataRevisao: 'desc' },
  });
}

export async function criar(usuarioId: string, input: CriarRevisaoInput) {
  const revisao = await prisma.revisao.create({ data: { ...input, usuarioId } });
  const googleEventId = await googleCalendar.criarEvento(usuarioId, revisao);
  if (!googleEventId) return revisao;
  return prisma.revisao.update({ where: { id: revisao.id }, data: { googleEventId } });
}

export async function atualizar(usuarioId: string, id: string, data: Partial<CriarRevisaoInput>) {
  const existe = await prisma.revisao.findFirst({ where: { id, usuarioId } });
  if (!existe) throw new NotFoundError('Revisão não encontrada');
  const atualizada = await prisma.revisao.update({ where: { id }, data });

  if (atualizada.googleEventId) {
    await googleCalendar.atualizarEvento(usuarioId, atualizada);
    return atualizada;
  }
  // Revisão criada antes de o usuário conectar o Google → cria o evento agora.
  const googleEventId = await googleCalendar.criarEvento(usuarioId, atualizada);
  if (!googleEventId) return atualizada;
  return prisma.revisao.update({ where: { id }, data: { googleEventId } });
}

export async function remover(usuarioId: string, id: string) {
  const existe = await prisma.revisao.findFirst({ where: { id, usuarioId } });
  if (!existe) throw new NotFoundError('Revisão não encontrada');
  await prisma.revisao.delete({ where: { id } });
  await googleCalendar.removerEvento(usuarioId, existe.googleEventId);
}

/** Conclui uma revisão pendente e (se inteligente) agenda a próxima automaticamente. */
export async function concluir(
  usuarioId: string,
  id: string,
  payload: { questoesFeitas: number; questoesAcertadas: number; tempoEstudo: number }
) {
  const rev = await prisma.revisao.findFirst({ where: { id, usuarioId } });
  if (!rev) throw new NotFoundError('Revisão não encontrada');

  const faixas = await getFaixas(usuarioId);
  const ap = calcularAproveitamento(payload.questoesFeitas, payload.questoesAcertadas);
  const proxima = calcularProximaRevisao(ap, today(), faixas);

  const concluida = await prisma.revisao.update({
    where: { id },
    data: {
      status: 'Concluída',
      questoesFeitas: payload.questoesFeitas,
      questoesAcertadas: payload.questoesAcertadas,
      aproveitamento: ap,
      tempoEstudo: payload.tempoEstudo,
      dataRevisao: today(),
      proximaRevisao: proxima,
      googleEventId: null, // revisão concluída não fica mais agendada no Google
    },
  });
  await googleCalendar.removerEvento(usuarioId, rev.googleEventId);

  let novaPendente = null;
  if (rev.gerarRevisaoInteligente) {
    novaPendente = await prisma.revisao.create({
      data: {
        usuarioId,
        tipo: rev.tipo,
        grandeArea: rev.grandeArea,
        subArea: rev.subArea,
        dataRevisao: proxima,
        tempoEstudo: 0,
        questoesFeitas: 0,
        questoesAcertadas: 0,
        aproveitamento: 0,
        status: 'Pendente',
        proximaRevisao: null,
        gerarRevisaoInteligente: true,
      },
    });
    const googleEventId = await googleCalendar.criarEvento(usuarioId, novaPendente);
    if (googleEventId) {
      novaPendente = await prisma.revisao.update({ where: { id: novaPendente.id }, data: { googleEventId } });
    }
  }

  return { concluida, novaPendente };
}

/** Redistribui as revisões atrasadas a partir de amanhã, em grupos por dia. */
export async function redistribuir(usuarioId: string) {
  const revisoes = await prisma.revisao.findMany({ where: { usuarioId } });
  const atrasadas = revisoes.filter(
    (r) => (r.status === 'Pendente' || r.status === 'Atrasada') && isPast(r.dataRevisao)
  );
  if (atrasadas.length === 0) return listar(usuarioId);

  const perDay = Math.ceil(atrasadas.length / 7);
  const atualizadas = await prisma.$transaction(
    atrasadas.map((r, idx) => {
      const daysOffset = Math.floor(idx / perDay) + 1;
      return prisma.revisao.update({
        where: { id: r.id },
        data: { dataRevisao: daysFromNow(daysOffset), status: 'Pendente' },
      });
    })
  );

  for (const r of atualizadas) {
    if (r.googleEventId) await googleCalendar.atualizarEvento(usuarioId, r);
  }

  return listar(usuarioId);
}
