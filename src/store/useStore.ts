import { create } from 'zustand';
import { api } from '../lib/api';
import { DEFAULT_CONFIG } from '../utils/algoritmoRevisao';
import type { Revisao, Simulado, Tarefa, Conteudo, ConfigAlgoritmo, GrandeArea } from '../types';

interface DataState {
  carregado: boolean;
  revisoes: Revisao[];
  simulados: Simulado[];
  tarefas: Tarefa[];
  conteudos: Conteudo[];
  configAlgoritmo: ConfigAlgoritmo;
  metaSemanal: number;

  carregarTudo: () => Promise<void>;
  limpar: () => void;

  addRevisao: (r: Omit<Revisao, 'id' | 'createdAt'>) => Promise<void>;
  updateRevisao: (id: string, data: Partial<Revisao>) => Promise<void>;
  deleteRevisao: (id: string) => Promise<void>;
  concluirRevisao: (id: string, feitas: number, acertadas: number, tempo: number) => Promise<void>;
  redistribuirAtrasadas: () => Promise<void>;
  addSimulado: (s: Omit<Simulado, 'id'>) => Promise<void>;
  deleteSimulado: (id: string) => Promise<void>;
  addTarefa: (texto: string) => Promise<void>;
  toggleTarefa: (id: string) => Promise<void>;
  deleteTarefa: (id: string) => Promise<void>;
  clearTarefasConcluidas: () => Promise<void>;
  addConteudo: (grandeArea: GrandeArea, subArea: string) => Promise<void>;
  deleteConteudo: (id: string) => Promise<void>;
  setConfigAlgoritmo: (c: ConfigAlgoritmo) => Promise<void>;
  setMetaSemanal: (m: number) => Promise<void>;
}

export const useStore = create<DataState>((set, get) => ({
  carregado: false,
  revisoes: [],
  simulados: [],
  tarefas: [],
  conteudos: [],
  configAlgoritmo: DEFAULT_CONFIG,
  metaSemanal: 150,

  carregarTudo: async () => {
    const [revisoes, simulados, tarefas, conteudos, config, meta] = await Promise.all([
      api.get<Revisao[]>('/app/revisoes'),
      api.get<Simulado[]>('/app/simulados'),
      api.get<Tarefa[]>('/app/tarefas'),
      api.get<Conteudo[]>('/app/conteudos'),
      api.get<{ faixas: ConfigAlgoritmo['faixas'] }>('/app/config'),
      api.get<{ meta: number }>('/app/meta'),
    ]);
    set({
      revisoes,
      simulados,
      tarefas,
      conteudos,
      configAlgoritmo: { faixas: config.faixas },
      metaSemanal: meta.meta,
      carregado: true,
    });
  },

  limpar: () =>
    set({
      carregado: false,
      revisoes: [],
      simulados: [],
      tarefas: [],
      conteudos: [],
      configAlgoritmo: DEFAULT_CONFIG,
      metaSemanal: 150,
    }),

  addRevisao: async (r) => {
    const created = await api.post<Revisao>('/app/revisoes', r);
    set((s) => ({ revisoes: [...s.revisoes, created] }));
  },

  updateRevisao: async (id, data) => {
    const updated = await api.patch<Revisao>(`/app/revisoes/${id}`, data);
    set((s) => ({ revisoes: s.revisoes.map((r) => (r.id === id ? updated : r)) }));
  },

  deleteRevisao: async (id) => {
    await api.del(`/app/revisoes/${id}`);
    set((s) => ({ revisoes: s.revisoes.filter((r) => r.id !== id) }));
  },

  concluirRevisao: async (id, feitas, acertadas, tempo) => {
    const { concluida, novaPendente } = await api.post<{ concluida: Revisao; novaPendente: Revisao | null }>(
      `/app/revisoes/${id}/concluir`,
      { questoesFeitas: feitas, questoesAcertadas: acertadas, tempoEstudo: tempo }
    );
    set((s) => {
      let revisoes = s.revisoes.map((r) => (r.id === id ? concluida : r));
      if (novaPendente) revisoes = [...revisoes, novaPendente];
      return { revisoes };
    });
  },

  redistribuirAtrasadas: async () => {
    const revisoes = await api.post<Revisao[]>('/app/revisoes/redistribuir');
    set({ revisoes });
  },

  addSimulado: async (sim) => {
    const created = await api.post<Simulado>('/app/simulados', sim);
    set((s) => ({ simulados: [created, ...s.simulados] }));
  },

  deleteSimulado: async (id) => {
    await api.del(`/app/simulados/${id}`);
    set((s) => ({ simulados: s.simulados.filter((x) => x.id !== id) }));
  },

  addTarefa: async (texto) => {
    const created = await api.post<Tarefa>('/app/tarefas', { texto });
    set((s) => ({ tarefas: [created, ...s.tarefas] }));
  },

  toggleTarefa: async (id) => {
    const cur = get().tarefas.find((t) => t.id === id);
    if (!cur) return;
    const updated = await api.patch<Tarefa>(`/app/tarefas/${id}`, { concluida: !cur.concluida });
    set((s) => ({ tarefas: s.tarefas.map((t) => (t.id === id ? updated : t)) }));
  },

  deleteTarefa: async (id) => {
    await api.del(`/app/tarefas/${id}`);
    set((s) => ({ tarefas: s.tarefas.filter((t) => t.id !== id) }));
  },

  clearTarefasConcluidas: async () => {
    await api.del('/app/tarefas/concluidas');
    set((s) => ({ tarefas: s.tarefas.filter((t) => !t.concluida) }));
  },

  addConteudo: async (grandeArea, subArea) => {
    const created = await api.post<Conteudo>('/app/conteudos', { grandeArea, subArea });
    set((s) => ({ conteudos: [...s.conteudos, created] }));
  },

  deleteConteudo: async (id) => {
    await api.del(`/app/conteudos/${id}`);
    set((s) => ({ conteudos: s.conteudos.filter((c) => c.id !== id) }));
  },

  setConfigAlgoritmo: async (c) => {
    const r = await api.put<{ faixas: ConfigAlgoritmo['faixas'] }>('/app/config', { faixas: c.faixas });
    set({ configAlgoritmo: { faixas: r.faixas } });
  },

  setMetaSemanal: async (m) => {
    const r = await api.put<{ meta: number }>('/app/meta', { meta: m });
    set({ metaSemanal: r.meta });
  },
}));
