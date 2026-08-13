import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { api } from '../../lib/api';
import { reais } from '../../lib/format';
import { useAuthStore } from '../../store/authStore';
import { SiteHeader } from '../../components/site/SiteHeader';
import { SiteFooter } from '../../components/site/SiteFooter';

interface Plano {
  id: string;
  nome: string;
  preco: number;
  intervalo: string;
}

export function Planos() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<Plano[]>('/billing/planos').then(setPlanos).catch(() => setErro('Não foi possível carregar os planos agora.'));
  }, []);

  function contratar(planoId: string) {
    if (accessToken) {
      navigate(`/app?plano=${planoId}`);
    } else {
      navigate(`/login?modo=register&plano=${planoId}`);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <section className="max-w-3xl mx-auto px-4 py-16 text-center flex-1 w-full">
        <h1 className="font-heading text-3xl font-bold text-white mb-2">Planos e assinatura</h1>
        <p className="text-gray-400 mb-10">Escolha o plano ideal para sua preparação.</p>

        {erro && <p className="text-sm text-red-400 mb-6">{erro}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {planos.map((p) => (
            <div key={p.id} className="bg-card border border-card-border rounded-2xl p-6 text-left">
              <p className="text-sm font-medium text-gray-400 mb-1">{p.nome}</p>
              <p className="text-3xl font-bold text-white mb-1">
                {reais(p.preco)}
                <span className="text-sm font-normal text-gray-500">
                  /{p.intervalo === 'year' ? 'ano' : 'mês'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mb-5">
                {p.intervalo === 'year' ? 'Cobrança anual' : 'Cobrança mensal'}
              </p>

              <ul className="space-y-2 mb-6 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-primary flex-shrink-0" /> Cronograma de revisões
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-primary flex-shrink-0" /> Dashboard de desempenho
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-primary flex-shrink-0" /> Foco Prova e simulados
                </li>
              </ul>

              <button
                onClick={() => contratar(p.id)}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
              >
                Contratar
              </button>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
