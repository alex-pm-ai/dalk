import { useState, useMemo } from 'react';
import { Trash2, Target, Plus, Search, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { SUB_AREAS, GRANDES_AREAS } from '../data/areas';
import { today, daysBetween, daysFromNow } from '../utils/dateUtils';
import { Checkbox } from '../components/ui/Checkbox';
import { ApiError } from '../lib/api';
import type { GrandeArea } from '../types';

/** Áreas de conteúdo de estudo (exclui as pseudo-áreas usadas só como tipo de atividade). */
const AREAS_ESTUDO = GRANDES_AREAS.filter(
  (a) => a !== 'Flashcards' && a !== 'Simulados'
) as GrandeArea[];

/** Sugestões fixas que acompanham o app. */
const SUGESTOES = AREAS_ESTUDO.flatMap((area) =>
  SUB_AREAS[area].map((sub) => ({ area, sub }))
);

interface ItemConteudo {
  area: GrandeArea;
  sub: string;
  /** Cadastrado pelo usuário (dá pra excluir) vs. sugestão fixa do app. */
  proprioId: string | null;
}

const chave = (area: string, sub: string) => `${area}|${sub}`;

export function FocoProva() {
  const { addRevisao, revisoes, deleteRevisao, conteudos, addConteudo, deleteConteudo } = useStore();

  const [dataProva, setDataProva] = useState('');
  const [frequencia, setFrequencia] = useState(3);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [filtroArea, setFiltroArea] = useState<'todas' | GrandeArea>('todas');
  const [generated, setGenerated] = useState(false);

  // Formulário de cadastro
  const [novoArea, setNovoArea] = useState<GrandeArea>(AREAS_ESTUDO[0]);
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroCadastro, setErroCadastro] = useState('');

  const focoRevisoes = revisoes.filter((r) => r.tipo === 'Questoes' && r.status === 'Pendente');

  // Conteúdos do usuário na frente; sugestão idêntica (mesma área + nome) é omitida
  // para o mesmo tema não aparecer duas vezes na lista.
  const todosConteudos = useMemo<ItemConteudo[]>(() => {
    const proprios: ItemConteudo[] = conteudos.map((c) => ({
      area: c.grandeArea,
      sub: c.subArea,
      proprioId: c.id,
    }));
    const jaTem = new Set(proprios.map((p) => chave(p.area, p.sub).toLowerCase()));
    const sugestoes: ItemConteudo[] = SUGESTOES.filter(
      (s) => !jaTem.has(chave(s.area, s.sub).toLowerCase())
    ).map((s) => ({ ...s, proprioId: null }));
    return [...proprios, ...sugestoes];
  }, [conteudos]);

  const filtrados = useMemo(() => {
    const termo = search.trim().toLowerCase();
    return todosConteudos.filter(
      (c) =>
        (filtroArea === 'todas' || c.area === filtroArea) &&
        (termo === '' || c.sub.toLowerCase().includes(termo))
    );
  }, [todosConteudos, search, filtroArea]);

  /** Itens visíveis agrupados por área, preservando a ordem de AREAS_ESTUDO. */
  const grupos = useMemo(() => {
    return AREAS_ESTUDO.map((area) => ({
      area,
      itens: filtrados
        .filter((c) => c.area === area)
        .sort((a, b) => {
          // Conteúdo próprio primeiro, depois alfabético
          if (!!a.proprioId !== !!b.proprioId) return a.proprioId ? -1 : 1;
          return a.sub.localeCompare(b.sub, 'pt-BR');
        }),
    })).filter((g) => g.itens.length > 0);
  }, [filtrados]);

  function toggle(key: string) {
    setSelected((s) => {
      const ns = new Set(s);
      if (ns.has(key)) ns.delete(key);
      else ns.add(key);
      return ns;
    });
  }

  function toggleGrupo(itens: ItemConteudo[]) {
    const keys = itens.map((i) => chave(i.area, i.sub));
    const todosMarcados = keys.every((k) => selected.has(k));
    setSelected((s) => {
      const ns = new Set(s);
      keys.forEach((k) => (todosMarcados ? ns.delete(k) : ns.add(k)));
      return ns;
    });
  }

  function toggleTodos() {
    const keys = filtrados.map((c) => chave(c.area, c.sub));
    const todosMarcados = keys.length > 0 && keys.every((k) => selected.has(k));
    setSelected(todosMarcados ? new Set() : new Set(keys));
  }

  async function handleCadastrar(e: React.FormEvent) {
    e.preventDefault();
    const nome = novoNome.trim();
    if (!nome) return;
    setSalvando(true);
    setErroCadastro('');
    try {
      await addConteudo(novoArea, nome);
      setNovoNome('');
    } catch (err) {
      setErroCadastro(
        err instanceof ApiError ? err.message : 'Não foi possível salvar o conteúdo.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleExcluirConteudo(item: ItemConteudo) {
    if (!item.proprioId) return;
    if (!window.confirm(`Excluir o conteúdo "${item.sub}"? Isso não pode ser desfeito.`)) return;
    const key = chave(item.area, item.sub);
    setSelected((s) => {
      const ns = new Set(s);
      ns.delete(key);
      return ns;
    });
    await deleteConteudo(item.proprioId);
  }

  function handleGerar() {
    if (!dataProva || selected.size === 0) return;
    const daysUntil = daysBetween(today(), dataProva);
    if (daysUntil <= 0) return;

    const items = Array.from(selected).map((k) => {
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
    focoRevisoes.forEach((r) => deleteRevisao(r.id));
    setGenerated(false);
  }

  const totalFiltrado = filtrados.length;
  const todosFiltradosMarcados =
    totalFiltrado > 0 && filtrados.every((c) => selected.has(chave(c.area, c.sub)));

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
            className="flex items-center gap-2 text-red-400 hover:text-red-300 text-xs font-medium border border-red-500/30 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Data da Prova</label>
            <input
              type="date"
              value={dataProva}
              onChange={(e) => setDataProva(e.target.value)}
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
                onChange={(e) => setFrequencia(Number(e.target.value))}
                className="flex-1 bg-muted border border-card-border rounded-l-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
              <span className="bg-muted border border-l-0 border-card-border rounded-r-lg px-3 py-2.5 text-xs text-gray-500 flex items-center">VEZES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seleção de conteúdos */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="mb-1">
          <h3 className="text-sm font-medium text-white">Selecione os Conteúdos</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            A lista abaixo traz sugestões prontas. Você também pode cadastrar seus próprios conteúdos —
            eles ficam salvos na sua conta.
          </p>
        </div>

        {/* Cadastrar conteúdo */}
        <form onSubmit={handleCadastrar} className="mt-4 bg-muted/50 border border-card-border rounded-lg p-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={novoArea}
              onChange={(e) => setNovoArea(e.target.value as GrandeArea)}
              aria-label="Área do novo conteúdo"
              className="bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary sm:w-56"
            >
              {AREAS_ESTUDO.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <input
              value={novoNome}
              onChange={(e) => { setNovoNome(e.target.value); setErroCadastro(''); }}
              placeholder="Nome do conteúdo (ex: Insuficiência hepática)"
              maxLength={120}
              className="flex-1 bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!novoNome.trim() || salvando}
              className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={14} />
              {salvando ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
          {erroCadastro && <p className="text-xs text-red-400 mt-2">{erroCadastro}</p>}
        </form>

        {/* Busca + filtro por área */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar conteúdo..."
              className="w-full bg-muted border border-card-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
          </div>
          <select
            value={filtroArea}
            onChange={(e) => setFiltroArea(e.target.value as 'todas' | GrandeArea)}
            aria-label="Filtrar por área"
            className="bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary sm:w-56"
          >
            <option value="todas">Todas as áreas</option>
            {AREAS_ESTUDO.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between mt-3 mb-1">
          <span className="text-xs text-gray-500">
            {totalFiltrado} conteúdo(s) {search || filtroArea !== 'todas' ? 'encontrado(s)' : 'disponível(is)'}
          </span>
          {totalFiltrado > 0 && (
            <button
              onClick={toggleTodos}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {todosFiltradosMarcados ? 'Limpar seleção' : 'Selecionar todos'}
            </button>
          )}
        </div>

        {/* Lista agrupada por área */}
        <div className="max-h-[28rem] overflow-y-auto pr-1 space-y-5 mt-3">
          {grupos.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-10">
              Nenhum conteúdo encontrado com esse filtro.
            </p>
          )}

          {grupos.map(({ area, itens }) => {
            const marcadosNoGrupo = itens.filter((i) => selected.has(chave(i.area, i.sub))).length;
            return (
              <div key={area}>
                <div className="flex items-center justify-between mb-2 sticky top-0 bg-card py-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wide truncate">{area}</h4>
                    <span className="text-[11px] text-gray-500 flex-shrink-0">
                      {marcadosNoGrupo}/{itens.length}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleGrupo(itens)}
                    className="text-[11px] text-gray-500 hover:text-primary transition-colors flex-shrink-0"
                  >
                    {marcadosNoGrupo === itens.length ? 'desmarcar' : 'marcar todos'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {itens.map((item) => {
                    const key = chave(item.area, item.sub);
                    const checked = selected.has(key);
                    return (
                      <div
                        key={key}
                        className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors ${
                          checked
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-card-border hover:border-gray-600 hover:bg-white/[0.02]'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                          <Checkbox checked={checked} onChange={() => toggle(key)} ariaLabel={item.sub} />
                          <span className={`text-xs truncate ${checked ? 'text-white' : 'text-gray-300'}`}>
                            {item.sub}
                          </span>
                        </label>

                        {item.proprioId && (
                          <>
                            <span className="text-[10px] text-primary/80 bg-primary/10 border border-primary/20 rounded px-1.5 py-0.5 flex-shrink-0">
                              meu
                            </span>
                            <button
                              onClick={() => handleExcluirConteudo(item)}
                              aria-label={`Excluir conteúdo ${item.sub}`}
                              title="Excluir conteúdo"
                              className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                            >
                              <X size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-card-border">
          <span className="text-xs text-gray-500">
            {selected.size} conteúdo(s) selecionado(s)
            {selected.size > 0 && dataProva && ` · ${selected.size * frequencia} revisões serão geradas`}
          </span>
          <button
            onClick={handleGerar}
            disabled={selected.size === 0 || !dataProva}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Target size={14} />
            Gerar Cronograma
          </button>
        </div>
      </div>
    </div>
  );
}
