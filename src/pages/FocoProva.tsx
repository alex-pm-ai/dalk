import { useState, useMemo } from 'react';
import { Trash2, Target } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SUB_AREAS, GRANDES_AREAS } from '../data/areas';
import { today, daysBetween, daysFromNow } from '../utils/dateUtils';
import type { GrandeArea } from '../types';

const ALL_CONTENTS = GRANDES_AREAS.filter(a => a !== 'Flashcards' && a !== 'Simulados').flatMap(area =>
  SUB_AREAS[area].map(sub => ({ area: area as GrandeArea, sub }))
);

export function FocoProva() {
  const { addRevisao, revisoes, deleteRevisao } = useStore();
  const [dataProva, setDataProva] = useState('');
  const [frequencia, setFrequencia] = useState(3);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [generated, setGenerated] = useState(false);

  const focoRevisoes = revisoes.filter(r => r.tipo === 'Questoes' && r.status === 'Pendente');

  const filteredContents = useMemo(() =>
    ALL_CONTENTS.filter(c => c.sub.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  function toggleAll() {
    if (selected.size === filteredContents.length) setSelected(new Set());
    else setSelected(new Set(filteredContents.map(c => `${c.area}|${c.sub}`)));
  }

  function toggle(key: string) {
    setSelected(s => {
      const ns = new Set(s);
      ns.has(key) ? ns.delete(key) : ns.add(key);
      return ns;
    });
  }

  function handleGerar() {
    if (!dataProva || selected.size === 0) return;
    const daysUntil = daysBetween(today(), dataProva);
    if (daysUntil <= 0) return;

    const items = Array.from(selected).map(k => {
      const [area, sub] = k.split('|');
      return { area: area as GrandeArea, sub };
    });

    // Distribui os conteúdos em repetições ao longo do período
    for (let rep = 0; rep < frequencia; rep++) {
      items.forEach((item, idx) => {
        const totalSlots = items.length * frequencia;
        const slotIdx = rep * items.length + idx;
        const offset = Math.max(1, Math.round((slotIdx / totalSlots) * daysUntil));
        addRevisao({
          tipo: 'Questoes',
          grandeArea: item.area,
          subArea: item.sub,
          dataRevisao: daysFromNow(Math.min(offset, daysUntil - 1)),
          tempoEstudo: 0,
          questoesFeitas: 0,
          questoesAcertadas: 0,
          aproveitamento: 0,
          status: 'Pendente',
          gerarRevisaoInteligente: false,
          proximaRevisao: null,
        });
      });
    }
    setGenerated(true);
    setSelected(new Set());
  }

  function handleClear() {
    focoRevisoes.forEach(r => deleteRevisao(r.id));
    setGenerated(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target size={20} className="text-primary" />
            Planejamento Foco Prova
          </h2>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Gere um cronograma intensivo focado na data da sua prova. Ideal para quando você está próximo
            da prova e quer revisar os temas mais relevantes com repetição espaçada.
          </p>
        </div>
        {focoRevisoes.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-medium border border-red-500/30 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={12} />
            Apagar Pendentes ({focoRevisoes.length})
          </button>
        )}
      </div>

      {generated && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-sm text-green-400">
          Cronograma gerado com sucesso! Verifique o Calendário para ver as revisões agendadas.
        </div>
      )}

      {/* Config */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-white mb-4">Configuração do Intensivo</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Data da Prova</label>
            <input
              type="date"
              value={dataProva}
              onChange={e => setDataProva(e.target.value)}
              min={today()}
              className="w-full bg-muted border border-card-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Frequência (Repetições por tema)</label>
            <div className="flex">
              <input
                type="number" min="1" max="10"
                value={frequencia}
                onChange={e => setFrequencia(Number(e.target.value))}
                className="flex-1 bg-muted border border-card-border rounded-l-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
              <span className="bg-[#1a2035] border border-l-0 border-card-border rounded-r-lg px-3 py-2.5 text-xs text-gray-500 flex items-center">VEZES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seleção de conteúdos */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Selecione os Conteúdos</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.size === filteredContents.length && filteredContents.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-primary focus:ring-0"
            />
            <span className="text-xs text-gray-400">Selecionar Todos ({filteredContents.length})</span>
          </label>
        </div>

        <div className="relative mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Pesquisar conteúdo..."
            className="w-full bg-muted border border-card-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto pr-1">
          {filteredContents.map(c => {
            const key = `${c.area}|${c.sub}`;
            const checked = selected.has(key);
            return (
              <label
                key={key}
                className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  checked ? 'border-primary/50 bg-primary/5' : 'border-card-border hover:border-gray-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="mt-0.5 w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-primary focus:ring-0 flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs text-white truncate">{c.sub}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{c.area}</p>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-card-border">
          <span className="text-xs text-gray-500">
            {selected.size} conteúdo(s) selecionado(s)
            {selected.size > 0 && dataProva && ` · ${selected.size * frequencia} revisões serão geradas`}
          </span>
          <button
            onClick={handleGerar}
            disabled={selected.size === 0 || !dataProva}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Target size={14} />
            Gerar Cronograma
          </button>
        </div>
      </div>
    </div>
  );
}
