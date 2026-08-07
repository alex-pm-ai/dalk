import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BarChart2, History, FileText,
  Calendar, Target, CheckSquare, Settings, Plus, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Logo } from '../ui/Logo';

const nav = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/desempenho',  icon: BarChart2,       label: 'Desempenho' },
  { to: '/historico',   icon: History,         label: 'Histórico' },
  { to: '/simulados',   icon: FileText,        label: 'Simulados' },
  { to: '/calendario',  icon: Calendar,        label: 'Calendário' },
  { to: '/foco-prova',  icon: Target,          label: 'Foco Prova' },
  { to: '/todo',        icon: CheckSquare,     label: 'To-Do & Pomodoro' },
  { to: '/config',      icon: Settings,        label: 'Configuração de revisão' },
];

interface Props {
  onAddRevisao: () => void;
  onAddFlashcard: () => void;
}

export function Sidebar({ onAddRevisao, onAddFlashcard }: Props) {
  const usuario = useAuthStore(s => s.usuario);
  const logout = useAuthStore(s => s.logout);

  return (
    <aside className="fixed top-0 left-0 h-screen w-52 bg-muted border-r border-card-border flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-card-border">
        <Logo size="sm" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Buttons */}
      <div className="px-3 pb-2 space-y-2">
        <button
          onClick={onAddFlashcard}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Adicionar Flashcards
        </button>
        <button
          onClick={onAddRevisao}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 text-sm font-medium transition-colors"
        >
          <Plus size={14} />
          Adicionar Revisão
        </button>
      </div>

      {/* User */}
      <div className="border-t border-card-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
            {(usuario?.nome ?? 'DA').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">{usuario?.nome ?? 'Residente'}</p>
            <p className="text-xs text-gray-500">{usuario?.tipo ?? 'R1'} · Residência</p>
          </div>
        </div>
        <button
          onClick={() => logout()}
          className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
          title="Sair"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  );
}
