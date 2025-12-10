import { useFormContext } from 'react-hook-form';
import { KeyRound } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface LicenseStepProps {
  onTrialSelect: () => void;
}

export function LicenseStep({ onTrialSelect }: LicenseStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-leather-900/40 to-shop-900 border border-leather-500/30 rounded-lg p-6">
        <h3 className="text-xl font-bold text-chrome-50 mb-2">Ativar Licença</h3>
        <p className="text-chrome-400 text-sm mb-4">
          Insira sua chave de licença para desbloquear todas as funcionalidades do sistema.
        </p>

        <div>
          <label className="block text-sm font-medium text-chrome-300 mb-1">License Key</label>
          <div className="relative">
            <KeyRound
              className="absolute left-3 top-1/2 -translate-y-1/2 text-chrome-500"
              size={18}
            />
            <input
              {...register('licenseKey')}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="w-full bg-shop-900 border border-leather-800/30 rounded-md pl-10 pr-4 py-3 text-chrome-100 focus:border-leather-500 outline-none font-mono tracking-widest uppercase"
            />
          </div>
          {errors.licenseKey && (
            <p className="text-red-500 text-sm mt-1">{String(errors.licenseKey.message)}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 text-center mt-6">
        <p className="text-chrome-400 text-sm">Ou se preferir testar antes</p>
        <Button
          type="button"
          variant="outline"
          onClick={onTrialSelect}
          className="w-full border-leather-500 text-leather-500 hover:bg-leather-500/10"
        >
          Experimentar Grátis
        </Button>
      </div>

      <div className="text-center">
        <a href="#" className="text-sm text-leather-500 hover:text-leather-400 underline">
          Ainda não tem uma licença? Compre aqui.
        </a>
      </div>
    </div>
  );
}
