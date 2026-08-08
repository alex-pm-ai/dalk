import { google } from 'googleapis';
import type { Revisao } from '@prisma/client';
import { prisma } from '../../shared/prisma.js';
import { env } from '../../shared/env.js';
import { signAccessToken, verifyAccessToken } from '../../shared/jwt.js';
import { AppError } from '../../shared/errors.js';

const SCOPES = ['https://www.googleapis.com/auth/calendar', 'openid', 'email'];

function getOAuthClient() {
  return new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, env.GOOGLE_REDIRECT_URI);
}

/** Monta a URL de consentimento do Google. O usuarioId viaja assinado no `state`. */
export function gerarUrlConexao(usuarioId: string): string {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError('Integração com Google Agenda não configurada no servidor', 500, 'google_nao_configurado');
  }
  const oauth2Client = getOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: signAccessToken(usuarioId),
  });
}

/** Troca o `code` do callback por tokens, cria o calendário "Mindfast" na 1ª conexão e salva a conta. */
export async function processarCallback(code: string, state: string): Promise<void> {
  const { sub: usuarioId } = verifyAccessToken(state);

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  if (!tokens.refresh_token) {
    throw new AppError(
      'Google não devolveu refresh_token — revogue o acesso em myaccount.google.com/permissions e conecte novamente',
      400,
      'sem_refresh_token'
    );
  }
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data: userinfo } = await oauth2.userinfo.get();
  const googleEmail = userinfo.email ?? 'conta-google';

  // Reaproveita o calendário "Mindfast" se o usuário já tinha conectado antes.
  const contaExistente = await prisma.googleAccount.findUnique({ where: { usuarioId } });
  let calendarId = contaExistente?.calendarId;
  if (!calendarId) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const { data: novoCalendario } = await calendar.calendars.insert({ requestBody: { summary: 'Mindfast' } });
    calendarId = novoCalendario.id!;
  }

  await prisma.googleAccount.upsert({
    where: { usuarioId },
    create: { usuarioId, googleEmail, refreshToken: tokens.refresh_token, calendarId },
    update: { googleEmail, refreshToken: tokens.refresh_token, calendarId },
  });
}

export async function getStatus(usuarioId: string) {
  const conta = await prisma.googleAccount.findUnique({ where: { usuarioId } });
  return conta ? { conectado: true as const, email: conta.googleEmail } : { conectado: false as const };
}

export async function desconectar(usuarioId: string): Promise<void> {
  await prisma.googleAccount.deleteMany({ where: { usuarioId } });
}

async function getClienteAutenticado(usuarioId: string) {
  const conta = await prisma.googleAccount.findUnique({ where: { usuarioId } });
  if (!conta) return null;
  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: conta.refreshToken });
  return { calendar: google.calendar({ version: 'v3', auth: oauth2Client }), calendarId: conta.calendarId };
}

/** Revisao só tem data (sem horário) → evento de dia inteiro no Google. */
function paraEventoDiaInteiro(revisao: Pick<Revisao, 'dataRevisao' | 'tipo' | 'grandeArea' | 'subArea'>) {
  const fim = new Date(revisao.dataRevisao + 'T00:00:00');
  fim.setDate(fim.getDate() + 1);
  return {
    summary: `Revisão: ${revisao.subArea}`,
    description: `${revisao.tipo} — ${revisao.grandeArea} (via Mindfast)`,
    start: { date: revisao.dataRevisao },
    end: { date: fim.toISOString().split('T')[0] },
  };
}

// As três funções abaixo são "best-effort": nunca lançam erro para quem
// chamou. Se o Google estiver fora do ar ou o token tiver expirado, a
// revisão continua valendo no banco local — só a sincronização fica pra trás.

export async function criarEvento(usuarioId: string, revisao: Revisao): Promise<string | null> {
  try {
    const cliente = await getClienteAutenticado(usuarioId);
    if (!cliente) return null;
    const { data } = await cliente.calendar.events.insert({
      calendarId: cliente.calendarId,
      requestBody: paraEventoDiaInteiro(revisao),
    });
    return data.id ?? null;
  } catch (err) {
    console.error('[google-calendar] falha ao criar evento:', err);
    return null;
  }
}

export async function atualizarEvento(usuarioId: string, revisao: Revisao): Promise<void> {
  if (!revisao.googleEventId) return;
  try {
    const cliente = await getClienteAutenticado(usuarioId);
    if (!cliente) return;
    await cliente.calendar.events.patch({
      calendarId: cliente.calendarId,
      eventId: revisao.googleEventId,
      requestBody: paraEventoDiaInteiro(revisao),
    });
  } catch (err) {
    console.error('[google-calendar] falha ao atualizar evento:', err);
  }
}

export async function removerEvento(usuarioId: string, googleEventId: string | null): Promise<void> {
  if (!googleEventId) return;
  try {
    const cliente = await getClienteAutenticado(usuarioId);
    if (!cliente) return;
    await cliente.calendar.events.delete({ calendarId: cliente.calendarId, eventId: googleEventId });
  } catch (err) {
    console.error('[google-calendar] falha ao remover evento:', err);
  }
}
