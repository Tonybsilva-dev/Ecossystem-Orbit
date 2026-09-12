import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { signUp } from './client';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    try {
      await signUp.email(
        {
          email: data.email,
          password: data.password,
          name: data.name,
        },
        {
          onSuccess: () => {
            toast.success('Conta criada com sucesso!');
            navigate('/onboarding');
          },
          onError: (ctx) => {
            setError(ctx.error.message || 'Erro ao criar conta. Tente novamente.');
            setLoading(false);
          },
        },
      );
    } catch (e: any) {
      setError(e.message || 'Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-shop-800/50 backdrop-blur-sm p-8 rounded-sm border border-leather-800/30 shadow-2xl max-w-md w-full mx-auto">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl text-chrome-100 font-serif mb-1">Crie sua conta</h2>
          <p className="text-chrome-400 text-sm">Comece a gerenciar sua barbearia hoje.</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 p-3 rounded text-red-200 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              {...register('name')}
              className="w-full bg-shop-900 border border-leather-800/50 rounded-sm p-2 text-chrome-200 focus:border-leather-700 outline-none transition-colors"
              placeholder="Seu nome"
            />
            {errors.name && (
              <span className="text-red-400 text-xs mt-1 block">{errors.name.message}</span>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-chrome-400 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-shop-900 border border-leather-800/50 rounded-sm p-2 text-chrome-200 focus:border-leather-700 outline-none transition-colors"
              placeholder="seu@email.com"
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
            {loading ? 'Criando conta...' : 'Registrar'}
          </Button>
        </form>

        <div className="text-center">
          <Link to="/login" className="text-xs text-chrome-400 hover:text-chrome-200 underline">
            Já tem uma conta? Faça login
          </Link>
        </div>
      </div>
    </div>
  );
}
