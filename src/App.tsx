import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useStore } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AddRevisaoModal } from './components/modals/AddRevisaoModal';
import { Home } from './pages/site/Home';
import { Planos } from './pages/site/Planos';
import { Login } from './pages/Login';
import { Assinar } from './pages/Assinar';
import { Dashboard } from './pages/Dashboard';
import { Desempenho } from './pages/Desempenho';
import { Historico } from './pages/Historico';
import { Simulados } from './pages/Simulados';
import { Calendario } from './pages/Calendario';
import { FocoProva } from './pages/FocoProva';
import { TodoPomodoro } from './pages/TodoPomodoro';
import { ConfigRevisao } from './pages/ConfigRevisao';

function Loader({ texto }: { texto: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-gray-400">
      <Loader2 size={22} className="animate-spin text-primary" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const carregado = useAuthStore((s) => s.carregado);
  const assinatura = useAuthStore((s) => s.assinatura);
  const carregarMe = useAuthStore((s) => s.carregarMe);

  const dataCarregado = useStore((s) => s.carregado);
  const carregarTudo = useStore((s) => s.carregarTudo);

  // Tem token mas ainda não validou a sessão → busca /auth/me
  useEffect(() => {
    if (accessToken && !carregado) carregarMe().catch(() => {});
  }, [accessToken, carregado, carregarMe]);

  // Assinatura ativa → carrega os dados do app
  useEffect(() => {
    if (assinatura?.ativa && !dataCarregado) carregarTudo().catch(() => {});
  }, [assinatura?.ativa, dataCarregado, carregarTudo]);

  if (!accessToken) return <Navigate to="/login" replace />;
  if (!carregado) return <Loader texto="Carregando sua sessão..." />;
  if (!assinatura?.ativa) return <Assinar />;
  if (!dataCarregado) return <Loader texto="Carregando seus dados..." />;
  return <>{children}</>;
}

function AppShell() {
  const [addRevisaoOpen, setAddRevisaoOpen] = useState(false);
  const [addFlashcardOpen, setAddFlashcardOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddRevisao={() => setAddRevisaoOpen(true)}
        onAddFlashcard={() => setAddFlashcardOpen(true)}
      />

      <div className="md:ml-52 flex-1 flex flex-col min-h-screen">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route index                element={<Dashboard />} />
            <Route path="desempenho"     element={<Desempenho />} />
            <Route path="historico"      element={<Historico />} />
            <Route path="simulados"      element={<Simulados />} />
            <Route path="calendario"     element={<Calendario />} />
            <Route path="foco-prova"     element={<FocoProva />} />
            <Route path="todo"           element={<TodoPomodoro />} />
            <Route path="config"         element={<ConfigRevisao />} />
          </Routes>
        </main>
      </div>

      <AddRevisaoModal open={addRevisaoOpen} onClose={() => setAddRevisaoOpen(false)} />
      <AddRevisaoModal
        open={addFlashcardOpen}
        onClose={() => setAddFlashcardOpen(false)}
        defaultTipo="Flashcards"
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/planos" element={<Planos />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app/*"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
