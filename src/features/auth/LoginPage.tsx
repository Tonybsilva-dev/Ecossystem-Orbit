import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { signIn } from './client';
import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: () => {
            navigate('/dashboard'); // Admin/Backoffice area
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Erro ao autenticar. Tente novamente.');
            setLoading(false);
          },
        },
      );
    } catch (e: any) {
      setError(e.message || 'Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/schedule', // Users go to scheduling
      });
    } catch {
      setError('Erro ao conectar com Google.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-shop-800/50 backdrop-blur-sm p-8 rounded-sm border border-leather-800/30 shadow-2xl">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl text-chrome-100 font-serif mb-1">Bem-vindo(a)</h2>
          <p className="text-chrome-400 text-sm">Escolha como deseja acessar</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 p-3 rounded text-red-200 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Customer Access */}
        <div className="pt-2">
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-chrome-200 text-shop-900 hover:bg-white"
            disabled={loading}
          >
            {loading ? 'Conectando...' : 'Entrar como Cliente (Google)'}
          </Button>
          <p className="text-xs text-center mt-2 text-chrome-400">
            Acesso exclusivo para agendamentos e compras.
          </p>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-chrome-400/20"></div>
          <span className="flex-shrink-0 mx-4 text-chrome-400 text-xs uppercase">
            Área Administrativa
          </span>
          <div className="flex-grow border-t border-chrome-400/20"></div>
        </div>

        {/* Backoffice Access */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-shop-900 border border-leather-800/50 rounded-sm p-2 text-chrome-200 focus:border-leather-700 outline-none transition-colors"
              placeholder="admin@barberflow.com"
            />
            {errors.email && (
              <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
              Senha
            </label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-shop-900 border border-leather-800/50 rounded-sm p-2 text-chrome-200 focus:border-leather-700 outline-none transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-red-400 text-xs mt-1 block">{errors.password.message}</span>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Acessando...' : 'Acessar Backoffice'}
          </Button>
        </form>
      </div>
    </div>
  );
}
