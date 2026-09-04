import { useLocation } from 'react-router-dom';
import { Flame, Menu } from 'lucide-react';
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

interface Props {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: Props) {
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
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="text-gray-400 hover:text-gray-200 transition-colors md:hidden"
          aria-label="Abrir menu"
          title="Abrir menu"
        >
          <Menu size={18} />
        </button>
        <span className="text-sm text-gray-400">{BREADCRUMBS[pathname] ?? 'Dashboard'}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1">
          <Flame size={13} className="text-orange-400" />
          <span className="text-xs font-medium text-orange-300">{streak} {streak === 1 ? 'dia' : 'dias'}</span>
        </div>
      </div>
    </header>
  );
}
