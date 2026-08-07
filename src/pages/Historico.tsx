import { useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Badge } from '../components/ui/Badge';
import { formatDate, minutesToHours } from '../utils/dateUtils';

export function Historico() {
  const { revisoes, deleteRevisao } = useStore();
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('Todas');

  const concluidas = revisoes.filter(r => r.status === 'Concluída')
    .sort((a, b) => b.dataRevisao.localeCompare(a.dataRevisao));

  const areas = ['Todas', ...Array.from(new Set(concluidas.map(r => r.grandeArea)))];

  const filtered = concluidas.filter(r => {
    const matchSearch = r.subArea.toLowerCase().includes(search.toLowerCase());
    const matchArea = filterArea === 'Todas' || r.grandeArea === filterArea;
    return matchSearch && matchArea;
  });

  function perfColor(ap: number) {
    if (ap >= 80) return 'text-green-400';
    if (ap >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  function perfBar(ap: number) {
    const color = ap >= 80 ? 'bg-green-500' : ap >= 60 ? 'bg-yellow-500' : 'bg-red-500';
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden w-20">
          <div className={`h-full ${color} rounded-full`} style={{ width: `${ap}%` }} />
        </div>
        <span className={`text-xs font-medium ${perfColor(ap)}`}>{ap}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Histórico de Estudos</h2>
        <span className="text-sm text-gray-500">{filtered.length} sessões</span>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por tema..."
            className="w-full bg-card border border-card-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={filterArea} onChange={e => setFilterArea(e.target.value)}
          className="bg-card border border-card-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-primary"
        >
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-card-border">
                {['Data', 'Grande Área', 'Título / Subárea', 'Tempo', 'Questões (C/T)', 'Desempenho', 'Ações'].map(h => (
                  <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3 first:pl-5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 text-sm py-10">Nenhuma sessão encontrada.</td>
                </tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className={`border-b border-card-border/50 hover:bg-white/2 transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                  <td className="px-4 py-3 pl-5 text-sm text-gray-300 whitespace-nowrap">{formatDate(r.dataRevisao)}</td>
                  <td className="px-4 py-3"><Badge label={r.tipo === 'Flashcards' ? 'Flashcards' : r.grandeArea} /></td>
                  <td className="px-4 py-3 text-sm text-white font-medium max-w-48 truncate">{r.subArea}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 whitespace-nowrap">{minutesToHours(r.tempoEstudo)}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    {r.tipo === 'Flashcards'
                      ? <span className="text-purple-400">{r.questoesFeitas} cards</span>
                      : <span className="text-gray-400"><span className="text-white">{r.questoesAcertadas}</span> / {r.questoesFeitas}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {r.tipo === 'Flashcards'
                      ? <div className="flex items-center gap-2"><div className="h-1.5 w-20 bg-green-500 rounded-full" /><span className="text-xs text-green-400">100%</span></div>
                      : perfBar(r.aproveitamento)
                    }
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteRevisao(r.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
