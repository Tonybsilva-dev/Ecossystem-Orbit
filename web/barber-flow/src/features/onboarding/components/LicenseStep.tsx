import { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { KeyRound, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { OrbitService, type Product } from '@/shared/services/orbit.service';
import { cn } from '@/shared/utils/cn';
import * as Dialog from '@radix-ui/react-dialog';

interface LicenseStepProps {
  onTrialSelect: () => void;
}

export function LicenseStep(_props: LicenseStepProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    const fetchPlans = async () => {
      // Hardcoded slug for BarberFlow. In real app, could come from config.
      const data = await OrbitService.getPlans('barberflow');
      setProduct(data);
      setLoadingPlans(false);
    };
    fetchPlans();
  }, []);

  const handlePlanSelect = (planId: string, interval: 'MONTHLY' | 'YEARLY') => {
    setSelectedPlanId(planId);
    setValue('planId', planId);
    setValue('interval', interval);
    setValue('licenseKey', 'NEW_SUBSCRIPTION'); // Signal backend to create SUB
  };

  const handleLicenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // The input is already bound to 'licenseKey' via register in the Dialog
    setIsDialogOpen(false);
    // Clear plan selection to avoid ambiguity
    setSelectedPlanId(null);
    setValue('planId', '');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Header & Activate Button (Simplified) */}

      {/* 2. Plan Carousel */}
      {loadingPlans ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-leather-500" size={32} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Toggle */}
          <div className="flex justify-center mb-2">
            <div className="bg-shop-900 p-1 rounded-full border border-leather-800/50 inline-flex shadow-inner">
              {(['MONTHLY', 'YEARLY'] as const).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setBillingInterval(interval)}
                  className={cn(
                    'px-6 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider',
                    billingInterval === interval
                      ? 'bg-leather-700 text-white shadow-lg'
                      : 'text-chrome-500 hover:text-chrome-300',
                  )}
                >
                  {interval === 'MONTHLY' ? 'Mensal' : 'Anual'}
                </button>
              ))}
            </div>
          </div>

          {/* CAROUSEL CONTAINER */}
          <div className="relative w-full overflow-x-auto pb-8 pt-4 px-4 snap-x snap-mandatory flex justify-start gap-6 no-scrollbar mask-linear-fade">
            {product?.plans
              .filter((p) => p.interval === billingInterval || Number(p.price) === 0)
              .map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => handlePlanSelect(plan.id, plan.interval)}
                  className={cn(
                    'snap-center shrink-0 w-[280px] relative p-6 rounded-2xl border transition-all duration-300 group cursor-pointer flex flex-col justify-between min-h-[320px]',
                    selectedPlanId === plan.id
                      ? 'bg-leather-900/10 border-leather-500 shadow-[0_0_40px_-10px_var(--color-leather-500)] scale-105 z-10'
                      : 'bg-shop-800/40 border-leather-800/30 hover:border-leather-600 hover:bg-shop-800/80 hover:scale-105',
                  )}
                >
                  {selectedPlanId === plan.id && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-leather-500 rounded-full flex items-center justify-center text-white shadow-lg animate-in zoom-in spin-in-90 duration-300 z-20">
                      <Check size={16} strokeWidth={4} />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-serif text-chrome-100">{plan.name}</h4>
                      {plan.name.toLowerCase().includes('pro') && (
                        <span className="bg-leather-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                          Pro
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-1 mb-6 border-b border-white/5 pb-4">
                      <span className="text-4xl font-bold text-chrome-100">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(plan.price))}
                      </span>
                      <span className="text-xs text-chrome-500">
                        /{plan.interval === 'MONTHLY' ? 'mês' : 'ano'}
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {plan.features.slice(0, 4).map((feat, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-chrome-400 group-hover:text-chrome-300 transition-colors"
                        >
                          <Check size={12} className="text-leather-500 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5">
                    <span
                      className={cn(
                        'block w-full text-center py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all',
                        selectedPlanId === plan.id
                          ? 'bg-leather-500 text-white border-transparent'
                          : 'border-white/10 text-chrome-500 group-hover:border-chrome-500 group-hover:text-chrome-300',
                      )}
                    >
                      {selectedPlanId === plan.id ? 'Selecionado' : 'Escolher'}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Hidden inputs */}
          <input type="hidden" {...register('planId')} />
          <input type="hidden" {...register('interval')} />
        </div>
      )}

      {/* LICENSE DIALOG */}
      <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
          <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-shop-900 border border-leather-700 p-6 rounded-xl shadow-2xl z-50 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <Dialog.Title className="text-xl font-bold text-white flex items-center gap-2">
                <KeyRound className="text-leather-500" />
                Ativar Licença
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="text-chrome-500 hover:text-white">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleLicenseSubmit} className="space-y-4">
              <p className="text-chrome-400 text-sm">
                Insira a chave de licença de 16 caracteres fornecida no momento da compra.
              </p>

              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-leather-600"
                  size={18}
                />
                <input
                  {...register('licenseKey')}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  maxLength={19} // dashes
                  className="w-full bg-shop-950 border border-leather-800/50 rounded-lg pl-10 pr-4 py-4 text-chrome-100 focus:border-leather-500 focus:ring-1 focus:ring-leather-500/50 outline-none font-mono tracking-[0.2em] text-center uppercase text-lg transition-all"
                />
              </div>
              {errors.licenseKey && (
                <p className="text-red-500 text-sm text-center">
                  {String(errors.licenseKey.message)}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" className="flex-1">
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button type="submit" variant="default" className="flex-1">
                  Verificar e Ativar
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
