import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from './store/authStore';
import { useStore } from './store/useStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AddRevisaoModal } from './components/modals/AddRevisaoModal';
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

function AppShell() {
  const [addRevisaoOpen, setAddRevisaoOpen] = useState(false);
  const [addFlashcardOpen, setAddFlashcardOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <Sidebar
          onAddRevisao={() => setAddRevisaoOpen(true)}
          onAddFlashcard={() => setAddFlashcardOpen(true)}
        />

        <div className="ml-52 flex-1 flex flex-col min-h-screen">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <Routes>
              <Route path="/"           element={<Dashboard />} />
              <Route path="/desempenho" element={<Desempenho />} />
              <Route path="/historico"  element={<Historico />} />
              <Route path="/simulados"  element={<Simulados />} />
              <Route path="/calendario" element={<Calendario />} />
              <Route path="/foco-prova" element={<FocoProva />} />
              <Route path="/todo"       element={<TodoPomodoro />} />
              <Route path="/config"     element={<ConfigRevisao />} />
            </Routes>
          </main>
        </div>
      </div>

      <AddRevisaoModal open={addRevisaoOpen} onClose={() => setAddRevisaoOpen(false)} />
      <AddRevisaoModal
        open={addFlashcardOpen}
        onClose={() => setAddFlashcardOpen(false)}
        defaultTipo="Flashcards"
      />
    </BrowserRouter>
  );
}

export default function App() {
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

  if (!accessToken) return <Login />;
  if (!carregado) return <Loader texto="Carregando sua sessão..." />;
  if (!assinatura?.ativa) return <Assinar />;
  if (!dataCarregado) return <Loader texto="Carregando seus dados..." />;
  return <AppShell />;
}
