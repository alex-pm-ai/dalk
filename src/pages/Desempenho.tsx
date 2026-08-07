import { useState } from 'react';
import { BarChart2, Clock, CheckSquare } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useStore } from '../store/useStore';
import { StatsCard } from '../components/ui/StatsCard';
import { AREA_COLORS } from '../data/areas';
import { daysAgo, DAY_NAMES_SHORT, minutesToHours, MONTH_NAMES, startOfMonth, formatDateShort } from '../utils/dateUtils';
import type { GrandeArea } from '../types';

type Period = 'Semana' | 'Mês';

export function Desempenho() {
  const revisoes = useStore(s => s.revisoes);
  const [period, setPeriod] = useState<Period>('Semana');

  const concluidas = revisoes.filter(r => r.status === 'Concluída');

  const acuraciaGeral = concluidas.filter(r => r.tipo === 'Questoes').length > 0
    ? Math.round(concluidas.filter(r => r.tipo === 'Questoes').reduce((s, r) => s + r.aproveitamento, 0) / concluidas.filter(r => r.tipo === 'Questoes').length)
    : 0;
  const totalHoras = concluidas.reduce((s, r) => s + r.tempoEstudo, 0);
  const totalQuestoes = concluidas.filter(r => r.tipo === 'Questoes').reduce((s, r) => s + r.questoesFeitas, 0);

  // Dados de questões por dia (semana) ou mês
  const questoesChart = (() => {
    if (period === 'Semana') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = daysAgo(6 - i);
        const dayRevs = concluidas.filter(r => r.dataRevisao === d);
        return {
          label: DAY_NAMES_SHORT[new Date(d + 'T12:00:00').getDay()],
          questoes: dayRevs.filter(r => r.tipo === 'Questoes').reduce((s, r) => s + r.questoesFeitas, 0),
          tempo: dayRevs.reduce((s, r) => s + r.tempoEstudo, 0),
        };
      });
    }
    // Mês: agrupar por semana
    const smStart = startOfMonth();
    return Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date(smStart + 'T12:00:00');
      weekStart.setDate(weekStart.getDate() + i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const ws = weekStart.toISOString().split('T')[0];
      const we = weekEnd.toISOString().split('T')[0];
      const weekRevs = concluidas.filter(r => r.dataRevisao >= ws && r.dataRevisao <= we);
      return {
        label: `Sem ${i + 1}`,
        questoes: weekRevs.filter(r => r.tipo === 'Questoes').reduce((s, r) => s + r.questoesFeitas, 0),
        tempo: weekRevs.reduce((s, r) => s + r.tempoEstudo, 0),
      };
    });
  })();

  // Questões por área
  const porAreaQ: Record<string, number> = {};
  concluidas.forEach(r => {
    const k = r.tipo === 'Flashcards' ? 'Flashcards' : r.tipo === 'Simulado' ? 'Simulados' : r.grandeArea;
    porAreaQ[k] = (porAreaQ[k] || 0) + (r.tipo === 'Questoes' ? r.questoesFeitas : r.tipo === 'Flashcards' ? 1 : 0);
  });
  const porAreaQData = Object.entries(porAreaQ).filter(([, v]) => v > 0).map(([name, value]) => ({
    name,
    value,
    pct: Math.round((value / (Object.values(porAreaQ).reduce((a, b) => a + b, 0) || 1)) * 100),
  }));

  // Tempo por área
  const porAreaT: Record<string, number> = {};
  concluidas.forEach(r => {
    const k = r.tipo === 'Flashcards' ? 'Flashcards' : r.grandeArea;
    porAreaT[k] = (porAreaT[k] || 0) + r.tempoEstudo;
  });
  const porAreaTData = Object.entries(porAreaT).filter(([, v]) => v > 0).map(([name, value]) => ({
    name,
    value,
    pct: Math.round((value / (Object.values(porAreaT).reduce((a, b) => a + b, 0) || 1)) * 100),
  }));

  const currentDate = new Date();
  const periodLabel = period === 'Semana'
    ? `${formatDateShort(daysAgo(6))} - ${formatDateShort(daysAgo(0))}`
    : MONTH_NAMES[currentDate.getMonth()];

  const PeriodBtn = ({ p }: { p: Period }) => (
    <button
      onClick={() => setPeriod(p)}
      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${period === p ? 'bg-primary text-primary-foreground' : 'text-gray-400 hover:text-white'}`}
    >
      {p}
    </button>
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#111827] border border-card-border rounded-lg px-3 py-2 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    );
  };

  const DonutChart = ({ data, title }: { data: typeof porAreaQData; title: string }) => (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-white">{title}</p>
        <button className="text-xs text-gray-500 flex items-center gap-1">
          Todo o período
        </button>
      </div>
      <div className="flex items-center gap-4">
        <PieChart width={160} height={160}>
          <Pie data={data} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={AREA_COLORS[entry.name as GrandeArea] ?? '#6b7280'} />
            ))}
          </Pie>
        </PieChart>
        <div className="flex-1 space-y-1.5">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: AREA_COLORS[d.name as GrandeArea] ?? '#6b7280' }} />
              <span className="text-xs text-gray-400 flex-1 truncate">{d.name} ({d.pct}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatsCard label="Acurácia Geral" value={`${acuraciaGeral}%`} icon={<BarChart2 size={16} className="text-yellow-400" />} iconBg="bg-yellow-600/20" />
        <StatsCard label="Total de Horas" value={minutesToHours(totalHoras)} icon={<Clock size={16} className="text-purple-400" />} iconBg="bg-purple-600/20" />
        <StatsCard label="Questões Realizadas" value={totalQuestoes} icon={<CheckSquare size={16} className="text-primary" />} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Line chart questões */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <span className="text-primary">↗</span> Questões Realizadas
            </p>
            <div className="flex items-center gap-1">
              <PeriodBtn p="Semana" /><PeriodBtn p="Mês" />
              <span className="text-xs text-gray-500 ml-1">{periodLabel}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={questoesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="questoes" name="Questões" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {porAreaQData.length > 0 && <DonutChart data={porAreaQData} title="Questões por área" />}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Line chart tempo */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-white flex items-center gap-2">
              <span className="text-green-400">◷</span> Tempo Estudado
            </p>
            <div className="flex items-center gap-1">
              <PeriodBtn p="Semana" /><PeriodBtn p="Mês" />
              <span className="text-xs text-gray-500 ml-1">{periodLabel}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={questoesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3b" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="tempo" name="Minutos" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {porAreaTData.length > 0 && <DonutChart data={porAreaTData} title="Tempo por área" />}
      </div>
    </div>
  );
}
