import { useLocation } from 'react-router-dom';
import { BookOpen, Bell, Flame } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { today, daysAgo } from '../../utils/dateUtils';

const BREADCRUMBS: Record<string, string> = {
  '/':            'Dashboard / Visão Geral',
  '/desempenho':  'Dashboard / Desempenho',
  '/historico':   'Dashboard / Histórico',
  '/simulados':   'Dashboard / Simulados',
  '/calendario':  'Dashboard / Calendário',
  '/foco-prova':  'Dashboard / Foco Prova',
  '/todo':        'Dashboard / Foco & Tarefas',
  '/config':      'Dashboard / Configuração',
};

export function Header() {
  const { pathname } = useLocation();
  const revisoes = useStore(s => s.revisoes);

  // Calcula streak: dias consecutivos com ao menos 1 revisão concluída
  const streak = (() => {
    let count = 0;
    let d = 0;
    while (true) {
      const dateStr = d === 0 ? today() : daysAgo(d);
      const hasSessao = revisoes.some(r => r.status === 'Concluída' && r.dataRevisao === dateStr);
      if (!hasSessao) break;
      count++;
      d++;
    }
    return count;
  })();

  return (
    <header className="h-12 flex items-center justify-between px-6 border-b border-card-border bg-background">
      <span className="text-sm text-gray-400">{BREADCRUMBS[pathname] ?? 'Dashboard'}</span>
      <div className="flex items-center gap-3">
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <BookOpen size={16} />
        </button>
        <button className="text-gray-500 hover:text-gray-300 transition-colors">
          <Bell size={16} />
        </button>
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1">
          <Flame size={13} className="text-orange-400" />
          <span className="text-xs font-medium text-orange-300">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
        </div>
      </div>
    </header>
  );
}
