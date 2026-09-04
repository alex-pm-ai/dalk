import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export function SiteHeader() {
  return (
    <header className="border-b border-card-border bg-background">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/">
          <Logo size="md" />
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/planos" className="text-sm text-gray-400 hover:text-white transition-colors">
            Planos
          </Link>
          <Link
            to="/login"
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Entrar
          </Link>
        </nav>
      </div>
    </header>
  );
}
