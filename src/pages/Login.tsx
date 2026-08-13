import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ApiError } from '../lib/api';
import { Logo } from '../components/ui/Logo';

export function Login() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [searchParams] = useSearchParams();
  const planoParam = searchParams.get('plano');
  const destinoAutenticado = planoParam ? `/app?plano=${planoParam}` : '/app';

  const [modo, setModo] = useState<'login' | 'register'>(
    searchParams.get('modo') === 'register' ? 'register' : 'login'
  );
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      if (modo === 'login') await login(email, senha);
      else await register(nome, email, senha);
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  }

  if (accessToken) return <Navigate to={destinoAutenticado} replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Link to="/">
            <Logo size="lg" />
          </Link>
        </div>

        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h1 className="text-lg font-bold text-white mb-1">
            {modo === 'login' ? 'Entrar' : 'Criar conta'}
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            {modo === 'login'
              ? 'Acesse sua plataforma de estudos.'
              : 'Comece sua preparação para a residência.'}
          </p>

          <form onSubmit={submit} className="space-y-3">
            {modo === 'register' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nome</label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full bg-muted border border-card-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-muted border border-card-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className="w-full bg-muted border border-card-border rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            {erro && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-gray-700 text-primary-foreground text-sm font-medium transition-colors"
            >
              {loading ? 'Aguarde...' : modo === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => {
                setModo(modo === 'login' ? 'register' : 'login');
                setErro('');
              }}
              className="text-xs text-gray-500 hover:text-primary transition-colors"
            >
              {modo === 'login'
                ? 'Não tem conta? Cadastre-se'
                : 'Já tem conta? Entrar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
