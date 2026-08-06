import { useEffect, useState } from 'react';
import { Check, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import { Logo } from '../components/ui/Logo';

interface Plano {
  id: string;
  nome: string;
  preco: number;
  intervalo: string;
}

interface CheckoutResp {
  metodo: string;
  pixQrCode: string | null;
  checkoutUrl: string | null;
  gatewayPayId: string;
}

const reais = (centavos: number) => `R$ ${(centavos / 100).toFixed(2).replace('.', ',')}`;

export function Assinar() {
  const carregarMe = useAuthStore((s) => s.carregarMe);
  const logout = useAuthStore((s) => s.logout);
  const usuario = useAuthStore((s) => s.usuario);

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [checkout, setCheckout] = useState<CheckoutResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get<Plano[]>('/billing/planos').then(setPlanos).catch(() => setErro('Erro ao carregar planos.'));
  }, []);

  // Após gerar o Pix, verifica o pagamento a cada 4s (o webhook é quem ativa)
  useEffect(() => {
    if (!checkout) return;
    const iv = setInterval(() => {
      void carregarMe();
    }, 4000);
    return () => clearInterval(iv);
  }, [checkout, carregarMe]);

  async function assinar(planoId: string) {
    setLoading(true);
    setErro('');
    try {
      const r = await api.post<CheckoutResp>('/billing/checkout', { planoId });
      setCheckout(r);
    } catch {
      setErro('Não foi possível gerar a cobrança.');
    } finally {
      setLoading(false);
    }
  }

  // Helper de desenvolvimento: simula o webhook de pagamento aprovado (MockGateway)
  async function simularPagamento() {
    if (!checkout) return;
    await api.post('/billing/webhook', {
      tipo: 'pagamento.aprovado',
      gatewayPayId: checkout.gatewayPayId,
      eventId: 'evt_' + Date.now(),
    });
    await carregarMe();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0c14] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Logo size="md" />
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={13} /> Sair
          </button>
        </div>

        {!checkout ? (
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h1 className="text-lg font-bold text-white mb-1">
              Olá, {usuario?.nome?.split(' ')[0] ?? 'residente'}!
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Escolha um plano para liberar o acesso à plataforma.
            </p>

            <div className="space-y-3">
              {planos.map((p) => (
                <div
                  key={p.id}
                  className="border border-card-border rounded-xl p-4 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{p.nome}</p>
                      <p className="text-xs text-gray-500">
                        {p.intervalo === 'year' ? 'Cobrança anual' : 'Cobrança mensal'}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {reais(p.preco)}
                      <span className="text-xs font-normal text-gray-500">
                        /{p.intervalo === 'year' ? 'ano' : 'mês'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => assinar(p.id)}
                    disabled={loading}
                    className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white text-sm font-medium transition-colors"
                  >
                    {loading ? 'Gerando...' : 'Assinar com Pix'}
                  </button>
                </div>
              ))}
            </div>

            {erro && <p className="text-xs text-red-400 mt-4">{erro}</p>}
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
            <h1 className="text-lg font-bold text-white mb-1">Pague com Pix</h1>
            <p className="text-sm text-gray-500 mb-5">
              Copie o código abaixo no app do seu banco. A liberação é automática após a confirmação.
            </p>

            <div className="bg-[#0d1117] border border-card-border rounded-xl p-4 mb-5">
              <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide">Pix Copia e Cola</p>
              <p className="text-xs text-gray-300 break-all font-mono">{checkout.pixQrCode}</p>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-blue-400 mb-5">
              <Loader2 size={15} className="animate-spin" />
              Aguardando confirmação do pagamento...
            </div>

            {/* Botão de DEV (mock) — remover ao plugar provedor real */}
            <button
              onClick={simularPagamento}
              className="w-full py-2 rounded-lg border border-green-500/30 bg-green-500/10 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={13} /> Simular pagamento aprovado (DEV)
            </button>

            <button
              onClick={() => setCheckout(null)}
              className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Escolher outro plano
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
