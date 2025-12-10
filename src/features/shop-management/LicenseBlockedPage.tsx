import { Lock, ShieldAlert } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

export function LicenseBlockedPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 -m-8 text-center p-8">
      <div className="bg-red-500/10 p-6 rounded-full mb-6 border border-red-500/20">
        <Lock className="text-red-500 w-16 h-16" />
      </div>

      <h1 className="text-3xl font-display text-chrome-100 mb-4">Funcionalidade Bloqueada</h1>

      <p className="text-chrome-400 max-w-lg mb-8 text-lg">
        Sua licença de uso está <span className="text-red-400 font-bold">Inativa</span> ou{' '}
        <span className="text-red-400 font-bold">Pendente</span>. Para acessar módulos avançados
        como este, você precisa regularizar sua assinatura.
      </p>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
        <Button variant="default">Ativar Licença Agora</Button>
      </div>

      <div className="mt-12 p-4 bg-shop-800/50 rounded-lg border border-leather-800/30 max-w-xl">
        <div className="flex gap-3 text-left">
          <ShieldAlert className="text-yellow-500 shrink-0" />
          <div>
            <h4 className="font-bold text-chrome-200">Por que isso acontece?</h4>
            <p className="text-sm text-chrome-500 mt-1">
              O sistema BarberFlow opera em módulos. Alguns módulos são gratuitos, e outros requerem
              uma licença de uso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
