import { useState, Fragment } from 'react';
import { Trash2, Trophy, BarChart2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useStore } from '../store/useStore';
import { StatsCard } from '../components/ui/StatsCard';
import { AddSimuladoModal } from '../components/modals/AddSimuladoModal';
import { formatDate, minutesToHours } from '../utils/dateUtils';
import { AREA_COLORS } from '../data/areas';
import type { GrandeArea } from '../types';

export function Simulados() {
  const { simulados, deleteSimulado } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const count = simulados.length;
  const mediaAcertos = count > 0 ? Math.round(simulados.reduce((s, sim) => s + sim.nota, 0) / count) : 0;
  const melhorNota = count > 0 ? Math.max(...simulados.map(s => s.nota)) : 0;

  // Radar: média por área de todos os simulados
  const areaMap: Record<string, { acertos: number; total: number }> = {};
  simulados.forEach(sim => {
    sim.detalhePorArea.forEach(d => {
      if (!areaMap[d.area]) areaMap[d.area] = { acertos: 0, total: 0 };
      areaMap[d.area].acertos += d.acertos;
      areaMap[d.area].total += d.total;
    });
  });
  const radarData = Object.entries(areaMap).map(([area, d]) => ({
    area: area.replace('Ginecologia e Obstetrícia', 'G.O.'),
    fullArea: area,
    pct: d.total > 0 ? Math.round((d.acertos / d.total) * 100) : 0,
    acertos: d.acertos,
    total: d.total,
  }));

  function notaColor(n: number) {
    if (n >= 70) return 'text-green-400';
    if (n >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Simulados</h2>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Adicionar Simulado
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Simulados Realizados" value={count} icon={<BarChart2 size={16} className="text-primary" />} />
        <StatsCard
          label="Média de Acertos"
          value={`${mediaAcertos}%`}
          icon={<BarChart2 size={16} className="text-orange-400" />}
          iconBg="bg-orange-600/20"
        />
        <StatsCard
          label="Melhor Nota"
          value={`${melhorNota}%`}
          icon={<Trophy size={16} className="text-green-400" />}
          iconBg="bg-green-600/20"
        />
      </div>

      {radarData.length > 0 && (
        <div className="bg-card border border-card-border rounded-xl p-5">
          <p className="text-sm font-medium text-white mb-4">Média por Área (Exclusivo Simulados)</p>
          <div className="flex gap-6 items-start">
            <ResponsiveContainer width={260} height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e2a3b" />
                <PolarAngleAxis dataKey="area" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="%" dataKey="pct" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip
                  content={({ active, payload }: any) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#111827] border border-card-border rounded-lg px-3 py-2 text-xs">
                        <p className="text-gray-300">{d.fullArea}</p>
                        <p className="text-indigo-400 font-bold">{d.pct}%</p>
                        <p className="text-gray-500">{d.acertos}/{d.total} questões</p>
                      </div>
                    );
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {radarData.map(d => (
                <div key={d.area}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300">{d.fullArea}</span>
                    <span className={`text-xs font-bold ${notaColor(d.pct)}`}>{d.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.pct}%`,
                        backgroundColor: AREA_COLORS[d.fullArea as GrandeArea] ?? '#6b7280',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{d.acertos} / {d.total} questões</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lista de simulados */}
      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              {['Data', 'Título / Ano', 'Tempo', 'Questões', 'Nota', ''].map(h => (
                <th key={h} className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {simulados.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-500 text-sm py-10">Nenhum simulado registrado.</td></tr>
            )}
            {simulados.map(sim => (
              <Fragment key={sim.id}>
                <tr
                  className="border-b border-card-border/50 hover:bg-white/2 cursor-pointer"
                  onClick={() => setExpanded(expanded === sim.id ? null : sim.id)}
                >
                  <td className="px-4 py-3 text-sm text-gray-300">{formatDate(sim.dataRealizacao)}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{sim.titulo}</p>
                    <p className="text-xs text-gray-500">Ano: {sim.ano}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{minutesToHours(sim.tempoGasto)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    <span className="text-white">{sim.questoesAcertadas}</span> / {sim.questoesTotal}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${notaColor(sim.nota)}`}>{sim.nota}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {expanded === sim.id ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                      <button
                        onClick={e => { e.stopPropagation(); deleteSimulado(sim.id); }}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === sim.id && sim.detalhePorArea.length > 0 && (
                  <tr className="border-b border-card-border/50 bg-muted">
                    <td colSpan={6} className="px-6 py-4">
                      <p className="text-xs font-medium text-gray-400 mb-3">Detalhe por Área</p>
                      <div className="space-y-2">
                        {sim.detalhePorArea.map(d => {
                          const pct = d.total > 0 ? Math.round((d.acertos / d.total) * 100) : 0;
                          return (
                            <div key={d.area} className="flex items-center gap-3">
                              <span className="text-xs text-gray-400 w-44">{d.area}</span>
                              <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: AREA_COLORS[d.area] ?? '#6b7280' }} />
                              </div>
                              <span className={`text-xs font-bold w-10 text-right ${notaColor(pct)}`}>{pct}%</span>
                              <span className="text-xs text-gray-600">{d.acertos}/{d.total}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <AddSimuladoModal open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
