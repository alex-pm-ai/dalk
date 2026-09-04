import { useState } from 'react';
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useStore } from '../store/useStore';
import { StatsCard } from '../components/ui/StatsCard';
import { today, getWeekDays, DAY_NAMES_SHORT, formatDateShort, minutesToHours, startOfWeek, endOfWeek } from '../utils/dateUtils';
import { AREA_COLORS } from '../data/areas';
import type { GrandeArea } from '../types';

export function Dashboard() {
  const { revisoes, metaSemanal, setMetaSemanal, redistribuirAtrasadas } = useStore();
  const [weekOffset, setWeekOffset] = useState(0);
  const [editMeta, setEditMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(String(metaSemanal));

  const swStart = startOfWeek();
  const swEnd = endOfWeek();

  const semanaAtual = revisoes.filter(
    r => r.dataRevisao >= swStart && r.dataRevisao <= swEnd && r.status === 'Concluída'
  );

  const questoesSemana = semanaAtual.filter(r => r.tipo === 'Questoes').reduce((s, r) => s + r.questoesFeitas, 0);
  const taxaSemana = semanaAtual.filter(r => r.tipo === 'Questoes').length > 0
    ? Math.round(semanaAtual.filter(r => r.tipo === 'Questoes').reduce((s, r) => s + r.aproveitamento, 0) / semanaAtual.filter(r => r.tipo === 'Questoes').length)
    : 0;
  const tempoSemana = semanaAtual.reduce((s, r) => s + r.tempoEstudo, 0);

  const atrasadas = revisoes.filter(r => (r.status === 'Pendente' || r.status === 'Atrasada') && r.dataRevisao < today());
  const maisAtrasada = atrasadas.sort((a, b) => a.dataRevisao.localeCompare(b.dataRevisao))[0];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(baseDate.toISOString().split('T')[0]);

  function saveMeta() {
    setMetaSemanal(Number(metaInput) || metaSemanal);
    setEditMeta(false);
  }

  const progress = Math.min(Math.round((questoesSemana / metaSemanal) * 100), 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Olá, residente!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Aqui está um resumo do seu progresso hoje.</p>
      </div>

      {/* Orientação para quem ainda não tem nenhuma revisão cadastrada */}
      {revisoes.length === 0 && (
        <div className="flex items-start gap-2.5 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
          <Sparkles size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-primary/90">
            Você ainda não tem nenhuma revisão cadastrada. Use o botão{' '}
            <span className="font-medium">"Adicionar Revisão"</span> no menu lateral para começar.
          </p>
        </div>
      )}

      {/* Alert atrasadas */}
      {atrasadas.length > 0 && (
        <div className="flex items-start justify-between bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-orange-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-300">
                Fique atento, existem {atrasadas.length} revisões atrasadas. Reagende-as para datas pertinentes.
              </p>
              {maisAtrasada && (
                <p className="text-xs text-orange-400/70 mt-0.5">
                  Revisão mais atrasada: <span className="font-medium">{maisAtrasada.subArea}</span> era para {maisAtrasada.dataRevisao}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={redistribuirAtrasadas}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            <RefreshCw size={12} />
            Redistribuir Atrasadas
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatsCard
          label="Questões resolvidas na semana"
          value={questoesSemana}
          sub="Continue o bom trabalho!"
          subColor="text-gray-500"
          icon={<TrendingUp size={16} className="text-primary" />}
        />
        <StatsCard
          label="Taxa de acerto na semana"
          value={`${taxaSemana}%`}
          sub={taxaSemana >= 70 ? 'Excelente! Você está acima da média.' : 'Continue praticando!'}
          subColor={taxaSemana >= 70 ? 'text-green-400' : 'text-yellow-400'}
          icon={<CheckCircle2 size={16} className="text-green-400" />}
          iconBg="bg-green-600/20"
        />
        <StatsCard
          label="Tempo de estudo na semana"
          value={minutesToHours(tempoSemana)}
          sub="Esta semana"
          subColor="text-gray-500"
          icon={<Clock size={16} className="text-purple-400" />}
          iconBg="bg-purple-600/20"
        />
      </div>

      {/* Meta semanal */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">Meta Semanal de Questões</p>
          {editMeta ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={metaInput}
                onChange={e => setMetaInput(e.target.value)}
                className="w-24 bg-muted border border-card-border rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-primary"
              />
              <button onClick={saveMeta} className="text-xs text-primary hover:text-primary">Salvar</button>
            </div>
          ) : (
            <button onClick={() => setEditMeta(true)} className="text-xs text-primary hover:text-primary">Definir Meta</button>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span>Progresso</span>
          <span>{questoesSemana} / {metaSemanal} ({progress}%)</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Calendário semanal */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white">Calendário Semanal</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 hover:bg-white/5 rounded" aria-label="Semana anterior" title="Semana anterior">
              <ChevronLeft size={16} className="text-gray-400" />
            </button>
            <span className="text-xs text-gray-400">
              {formatDateShort(weekDays[0])} - {formatDateShort(weekDays[6])}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="p-1 hover:bg-white/5 rounded" aria-label="Próxima semana" title="Próxima semana">
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {DAY_NAMES_SHORT.map(d => (
            <div key={d} className="text-center text-xs text-gray-500 font-medium pb-1">{d}</div>
          ))}
          {weekDays.map(date => {
            const dayRevs = revisoes.filter(r => r.dataRevisao === date);
            const isToday = date === today();
            return (
              <div key={date} className={`min-h-24 rounded-lg border p-1.5 ${isToday ? 'border-primary/50 bg-primary/5' : 'border-card-border'}`}>
                <p className={`text-xs font-medium mb-1 text-center w-6 h-6 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-primary text-primary-foreground' : 'text-gray-400'}`}>
                  {parseInt(date.split('-')[2])}
                </p>
                <div className="space-y-0.5">
                  {dayRevs.slice(0, 4).map(r => (
                    <div
                      key={r.id}
                      className="text-[10px] px-1 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: `${AREA_COLORS[r.grandeArea as GrandeArea]}22`,
                        color: AREA_COLORS[r.grandeArea as GrandeArea],
                        borderLeft: `2px solid ${AREA_COLORS[r.grandeArea as GrandeArea]}`,
                      }}
                    >
                      {r.subArea}
                    </div>
                  ))}
                  {dayRevs.length > 4 && (
                    <div className="text-[10px] text-gray-500 px-1">+{dayRevs.length - 4} mais</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-card-border">
          {[
            { label: 'Pendente', color: 'bg-gray-500' },
            { label: 'Concluída', color: 'bg-green-500' },
            { label: 'Atrasada', color: 'bg-red-500' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${l.color}`} />
              <span className="text-xs text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
