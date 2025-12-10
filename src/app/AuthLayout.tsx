import { Outlet } from 'react-router';
import { Button } from '@/shared/ui/Button';
import { Link } from 'react-router';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-shop-900 flex flex-col items-center justify-center p-4 bg-noise relative">
      <Link to="/" className="absolute top-8 left-8">
        <Button variant="ghost" className="text-chrome-400 hover:text-white">
          &larr; Voltar para Home
        </Button>
      </Link>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif font-bold text-3xl text-chrome-100 uppercase tracking-widest mb-2">
            Barber<span className="text-leather-700">Flow</span>
          </h1>
          <p className="text-chrome-400 text-sm">Acesso Restrito</p>
        </div>

        <Outlet />
      </div>
    </div>
  );
}
