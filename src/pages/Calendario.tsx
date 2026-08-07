import { useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMonthDays, MONTH_NAMES, DAY_NAMES_SHORT, today, isPast } from '../utils/dateUtils';

const STATUS_COLORS = {
  Concluída: '#22c55e',
  Pendente:  '#818cf8',
  Atrasada:  '#ef4444',
};

export function Calendario() {
  const { revisoes, redistribuirAtrasadas, deleteRevisao } = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selected, setSelected] = useState<string | null>(null);

  const cells = getMonthDays(year, month);
  const todayStr = today();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  function getRevs(date: string) {
    return revisoes.filter(r => r.dataRevisao === date);
  }

  const selectedRevs = selected ? getRevs(selected) : [];

  const atrasadas = revisoes.filter(r =>
    (r.status === 'Pendente' || r.status === 'Atrasada') && isPast(r.dataRevisao)
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Calendário de Revisões</h2>
          <p className="text-sm text-gray-500">Gerencie sua agenda de estudos inteligente.</p>
        </div>
        <div className="flex items-center gap-2">
          {atrasadas.length > 0 && (
            <button
              onClick={redistribuirAtrasadas}
              className="flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-medium px-3 py-2 rounded-lg border border-orange-500/30 transition-colors"
            >
              <RefreshCw size={12} />
              Redistribuir Atrasadas ({atrasadas.length})
            </button>
          )}
          <div className="flex items-center gap-2 bg-card border border-card-border rounded-lg px-3 py-2">
            <button onClick={prevMonth} className="text-gray-400 hover:text-white">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-white min-w-32 text-center">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={nextMonth} className="text-gray-400 hover:text-white">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Calendar grid */}
        <div className="flex-1 bg-card border border-card-border rounded-xl overflow-hidden">
          {/* Header dias da semana */}
          <div className="grid grid-cols-7 border-b border-card-border">
            {DAY_NAMES_SHORT.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-3 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Grid dias */}
          <div className="grid grid-cols-7">
            {cells.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="border-b border-r border-card-border/30 min-h-28 bg-background/30" />;

              const dayRevs = getRevs(date);
              const isToday = date === todayStr;
              const isSelected = date === selected;
              const dayNum = parseInt(date.split('-')[2]);

              return (
                <div
                  key={date}
                  onClick={() => setSelected(isSelected ? null : date)}
                  className={`border-b border-r border-card-border/30 min-h-28 p-1.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary/10' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? 'bg-primary text-primary-foreground' : 'text-gray-400'
                    }`}>
                      {dayNum}
                    </span>
                    {dayRevs.length > 0 && (
                      <span className="text-[10px] text-gray-600">{dayRevs.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayRevs.slice(0, 3).map(r => (
                      <div
                        key={r.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate leading-tight"
                        style={{
                          backgroundColor: `${STATUS_COLORS[r.status]}18`,
                          color: STATUS_COLORS[r.status],
                          borderLeft: `2px solid ${STATUS_COLORS[r.status]}`,
                        }}
                      >
                        {r.subArea}
                      </div>
                    ))}
                    {dayRevs.length > 3 && (
                      <div className="text-[10px] text-gray-600 pl-1">+{dayRevs.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel lateral */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-card border border-card-border rounded-xl p-4 sticky top-4">
            {selected ? (
              <>
                <p className="text-sm font-medium text-white mb-3">
                  {parseInt(selected.split('-')[2])} de {MONTH_NAMES[parseInt(selected.split('-')[1]) - 1]}
                </p>
                {selectedRevs.length === 0 ? (
                  <p className="text-xs text-gray-500">Nenhuma revisão neste dia.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRevs.map(r => (
                      <div key={r.id} className="bg-muted rounded-lg p-2.5">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white truncate">{r.subArea}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{r.grandeArea}</p>
                          </div>
                          <button onClick={() => deleteRevisao(r.id)} className="text-gray-700 hover:text-red-400 flex-shrink-0">
                            <Trash2 size={11} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: STATUS_COLORS[r.status] }}
                          />
                          <span className="text-[10px]" style={{ color: STATUS_COLORS[r.status] }}>{r.status}</span>
                        </div>
                        {r.status === 'Concluída' && (
                          <p className="text-[10px] text-gray-600 mt-0.5">{r.aproveitamento}% de acerto</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">Clique em um dia para ver as revisões.</p>
            )}

            {/* Legenda */}
            <div className="mt-4 pt-4 border-t border-card-border space-y-1.5">
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs text-gray-500">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
