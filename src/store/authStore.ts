import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, API_URL, ApiError } from '../lib/api';
import { useStore } from './useStore';

// Evita disparar /auth/me (e um possível /auth/refresh) em duplicidade quando
// carregarMe() é chamado mais de uma vez em paralelo (ex.: StrictMode em dev).
let meInFlight: Promise<void> | null = null;

export interface UsuarioAuth {
  id: string;
  nome: string;
  email: string;
  tipo: string;
}

export interface AssinaturaInfo {
  status: string;
  ativa: boolean;
  validoAte: string | null;
  plano: { nome: string; intervalo: string } | null;
}

interface TokensResp {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioAuth;
}

interface MeResp {
  usuario: UsuarioAuth;
  assinatura: AssinaturaInfo;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioAuth | null;
  assinatura: AssinaturaInfo | null;
  carregado: boolean; // /auth/me já resolveu nesta sessão

  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, tipo: string) => Promise<void>;
  logout: () => Promise<void>;
  carregarMe: () => Promise<void>;
  tentarRefresh: () => Promise<boolean>;
  marcarAssinaturaInativa: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      assinatura: null,
      carregado: false,

      login: async (email, senha) => {
        const r = await api.post<TokensResp>('/auth/login', { email, senha });
        set({ accessToken: r.accessToken, refreshToken: r.refreshToken, usuario: r.usuario });
        await get().carregarMe();
      },

      register: async (nome, email, senha, tipo) => {
        const r = await api.post<TokensResp>('/auth/register', { nome, email, senha, tipo });
        set({ accessToken: r.accessToken, refreshToken: r.refreshToken, usuario: r.usuario });
        await get().carregarMe();
      },

      carregarMe: async () => {
        if (meInFlight) return meInFlight;
        meInFlight = (async () => {
          try {
            const r = await api.get<MeResp>('/auth/me');
            set({ usuario: r.usuario, assinatura: r.assinatura, carregado: true });
          } catch (e) {
            // Token expirado/inválido: tenta renovar via refresh e repetir uma vez.
            // (api.ts não auto-renova rotas /auth/*, então tratamos aqui.)
            if (e instanceof ApiError && e.status === 401) {
              const ok = await get().tentarRefresh();
              if (ok) {
                const r = await api.get<MeResp>('/auth/me');
                set({ usuario: r.usuario, assinatura: r.assinatura, carregado: true });
                return;
              }
              // Refresh falhou → sessão morta: limpa tudo e cai no Login.
              await get().logout();
              return;
            }
            // Erro de rede (API fora do ar etc.) → propaga para quem chamou.
            throw e;
          } finally {
            meInFlight = null;
          }
        })();
        return meInFlight;
      },

      tentarRefresh: async () => {
        const rt = get().refreshToken;
        if (!rt) return false;
        try {
          const res = await fetch(API_URL + '/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (!res.ok) return false;
          const d = (await res.json()) as { accessToken: string; refreshToken: string };
          set({ accessToken: d.accessToken, refreshToken: d.refreshToken });
          return true;
        } catch {
          return false;
        }
      },

      logout: async () => {
        const rt = get().refreshToken;
        if (rt) {
          try {
            await api.post('/auth/logout', { refreshToken: rt });
          } catch {
            /* ignora */
          }
        }
        set({ accessToken: null, refreshToken: null, usuario: null, assinatura: null, carregado: false });
        useStore.getState().limpar();
      },

      marcarAssinaturaInativa: () => {
        const a = get().assinatura;
        set({
          assinatura: a
            ? { ...a, ativa: false }
            : { status: 'inativa', ativa: false, validoAte: null, plano: null },
        });
      },
    }),
    {
      name: 'dalk-auth',
      // persiste só os tokens + usuário (assinatura é sempre revalidada via /auth/me)
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        usuario: s.usuario,
      }),
    }
  )
);
