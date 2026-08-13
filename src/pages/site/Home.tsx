import { Navigate, Link } from 'react-router-dom';
import {
  Calendar, BarChart2, History, TrendingUp, Target, Repeat, CheckSquare, Smartphone,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

const FUNCIONALIDADES = [
  { icon: Calendar, titulo: 'Cronograma de estudos', texto: 'Organize suas revisões por data, sem precisar montar planilha nenhuma.' },
  { icon: BarChart2, titulo: 'Dashboard de desempenho', texto: 'Acompanhe sua taxa de acertos e evolução semana a semana.' },
  { icon: History, titulo: 'Histórico completo', texto: 'Todo questão e simulado registrado, sempre disponível pra consulta.' },
  { icon: TrendingUp, titulo: 'Evolução por matéria', texto: 'Veja onde você está indo bem e onde precisa reforçar — por área.' },
  { icon: Target, titulo: 'Metas semanais', texto: 'Defina quantas questões quer resolver por semana e acompanhe o progresso.' },
  { icon: Repeat, titulo: 'Foco Prova', texto: 'Repetição espaçada: revisa mais o que você erra, menos o que já domina.' },
  { icon: CheckSquare, titulo: 'To-Do & Pomodoro', texto: 'Liste tarefas do dia e estude com ciclos de foco integrados.' },
  { icon: Smartphone, titulo: 'Web e mobile', texto: 'Acesse pelo computador ou pelo celular, onde for mais conveniente.' },
];

const FAQ = [
  {
    pergunta: 'Posso cancelar quando quiser?',
    resposta: 'Sim. O cancelamento é imediato a partir da sua solicitação, e seu acesso continua valendo até o fim do período que você já pagou.',
  },
  {
    pergunta: 'O que acontece se eu mudar de plano mensal pra anual?',
    resposta: 'Ao assinar o plano anual, ele substitui a sua assinatura mensal atual — sem precisar cancelar nada antes.',
  },
  {
    pergunta: 'A Mindfast tem aulas ou questões comentadas?',
    resposta: 'Não. A Mindfast é uma ferramenta de organização e acompanhamento de estudo — você estuda com o material que já usa, e a plataforma cuida do cronograma, das métricas e da repetição espaçada.',
  },
  {
    pergunta: 'Funciona para quem já está na residência ou só para quem vai prestar a prova?',
    resposta: 'Funciona para os dois casos. Ao criar sua conta você escolhe seu nível (pré-residência, R1, R2 ou R3), e a plataforma se adapta à sua fase.',
  },
  {
    pergunta: 'Quais formas de pagamento são aceitas?',
    resposta: 'Hoje aceitamos Pix. Outras formas de pagamento estão no roadmap.',
  },
];

export function Home() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-heading text-4xl font-bold text-white mb-4">
          Estude com método. Evolua com dados.
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          A Mindfast organiza sua rotina de estudos e mostra exatamente onde você está evoluindo —
          feita para estudantes de medicina e residentes.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/planos"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Ver planos
          </Link>
          <Link
            to="/login"
            className="border border-card-border hover:bg-white/5 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold text-white text-center mb-10">
          O que você tem na Mindfast
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FUNCIONALIDADES.map(({ icon: Icon, titulo, texto }) => (
            <div key={titulo} className="bg-card border border-card-border rounded-xl p-5">
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <Icon size={18} className="text-primary" />
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{titulo}</h3>
              <p className="text-xs text-gray-500">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="font-heading text-2xl font-bold text-white text-center mb-8">
          Perguntas frequentes
        </h2>
        <div className="space-y-3">
          {FAQ.map(({ pergunta, resposta }) => (
            <details key={pergunta} className="bg-card border border-card-border rounded-lg p-4 group">
              <summary className="text-sm font-medium text-white cursor-pointer list-none flex items-center justify-between">
                {pergunta}
                <span className="text-gray-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-gray-400 mt-3">{resposta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-heading text-2xl font-bold text-white mb-3">
          Comece hoje a acompanhar sua evolução
        </h2>
        <Link
          to="/planos"
          className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Ver planos
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
