import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Trash, Play, Pause, RotateCcw, Settings, ListChecks } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Checkbox } from '../components/ui/Checkbox';

type PomodoroMode = 'Pomodoro' | 'Pausa Curta' | 'Pausa Longa';

const DURATIONS: Record<PomodoroMode, number> = {
  'Pomodoro': 25 * 60,
  'Pausa Curta': 5 * 60,
  'Pausa Longa': 15 * 60,
};

const MODE_COLORS: Record<PomodoroMode, string> = {
  'Pomodoro': '#ef4444',
  'Pausa Curta': '#22c55e',
  'Pausa Longa': '#3b82f6',
};

export function TodoPomodoro() {
  const { tarefas, addTarefa, toggleTarefa, deleteTarefa, clearTarefasConcluidas } = useStore();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<PomodoroMode>('Pomodoro');
  const [timeLeft, setTimeLeft] = useState(DURATIONS['Pomodoro']);
  const [running, setRunning] = useState(false);
  const [customDurations, setCustomDurations] = useState({ ...DURATIONS });
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pending = tarefas.filter(t => !t.concluida);
  const done = tarefas.filter(t => t.concluida);

  useEffect(() => {
    setTimeLeft(customDurations[mode]);
    setRunning(false);
  }, [mode]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setRunning(false);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  function reset() {
    setRunning(false);
    setTimeLeft(customDurations[mode]);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim()) { addTarefa(input.trim()); setInput(''); }
  }

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const color = MODE_COLORS[mode];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-white">Foco e Tarefas</h2>
      <p className="text-sm text-gray-500 -mt-3">Gerencie suas tarefas e mantenha o foco com o Pomodoro.</p>

      <div className="grid grid-cols-5 gap-4">
        {/* To-Do */}
        <div className="col-span-3 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <ListChecks size={15} className="text-primary" />
              Tarefas
              {pending.length > 0 && (
                <span className="text-xs font-normal text-gray-500">
                  {pending.length} pendente{pending.length > 1 ? 's' : ''}
                </span>
              )}
            </h3>
            {done.length > 0 && (
              <button
                onClick={clearTarefasConcluidas}
                aria-label="Limpar tarefas concluídas"
                title="Limpar tarefas concluídas"
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash size={14} />
              </button>
            )}
          </div>

          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Adicionar nova tarefa..."
              className="flex-1 bg-muted border border-card-border rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary"
            />
            <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg transition-colors">
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {pending.map(t => (
              <div key={t.id} className="flex items-center gap-2.5 group px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                  <Checkbox checked={false} onChange={() => toggleTarefa(t.id)} ariaLabel={t.texto} />
                  <span className="text-sm text-gray-200 break-words">{t.texto}</span>
                </label>
                <button
                  onClick={() => deleteTarefa(t.id)}
                  aria-label={`Excluir tarefa ${t.texto}`}
                  title="Excluir tarefa"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {done.map(t => (
              <div key={t.id} className="flex items-center gap-2.5 group px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                  <Checkbox checked onChange={() => toggleTarefa(t.id)} ariaLabel={t.texto} />
                  <span className="text-sm text-gray-500 line-through break-words">{t.texto}</span>
                </label>
                <button
                  onClick={() => deleteTarefa(t.id)}
                  aria-label={`Excluir tarefa ${t.texto}`}
                  title="Excluir tarefa"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {tarefas.length === 0 && (
              <p className="text-center text-gray-600 text-sm py-6">Nenhuma tarefa. Adicione acima!</p>
            )}
          </div>
        </div>

        {/* Pomodoro */}
        <div className="col-span-2 bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center gap-1 mb-6">
            {(['Pomodoro', 'Pausa Curta', 'Pausa Longa'] as PomodoroMode[]).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  mode === m ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div
            className="text-center rounded-xl p-8 mb-6"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
          >
            <div className="text-6xl font-bold tabular-nums mb-2" style={{ color }}>
              {mins}:{secs}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">
              {running ? 'FOCADO!' : timeLeft === 0 ? 'CONCLUÍDO!' : 'PRONTO PARA COMEÇAR?'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setRunning(r => !r)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: `${color}30`, border: `2px solid ${color}` }}
            >
              {running
                ? <Pause size={20} style={{ color }} />
                : <Play size={20} style={{ color, marginLeft: 2 }} />
              }
            </button>
            <button
              onClick={reset}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <RotateCcw size={16} className="text-gray-400" />
            </button>
            <button
              onClick={() => setShowSettings(s => !s)}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <Settings size={16} className="text-gray-400" />
            </button>
          </div>

          {showSettings && (
            <div className="mt-5 pt-4 border-t border-card-border space-y-3">
              <p className="text-xs font-medium text-gray-400">Duração (minutos)</p>
              {(['Pomodoro', 'Pausa Curta', 'Pausa Longa'] as PomodoroMode[]).map(m => (
                <div key={m} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{m}</span>
                  <input
                    type="number" min="1" max="90"
                    value={Math.round(customDurations[m] / 60)}
                    onChange={e => {
                      const v = Math.max(1, Number(e.target.value)) * 60;
                      setCustomDurations(d => ({ ...d, [m]: v }));
                      if (mode === m) setTimeLeft(v);
                    }}
                    className="w-16 bg-muted border border-card-border rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-card-border">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Pendentes: <span className="text-gray-400">{pending.length}</span></span>
              <span>Concluídas: <span className="text-green-500">{done.length}</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
