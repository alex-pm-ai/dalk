import { Logo } from '../ui/Logo';

export function SiteFooter() {
  return (
    <footer className="border-t border-card-border py-8">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        <Logo size="sm" />
        <p className="text-xs text-gray-500">© {new Date().getFullYear()} Mindfast</p>
      </div>
    </footer>
  );
}
