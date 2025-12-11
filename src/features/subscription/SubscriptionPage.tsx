import { useEffect, useState } from 'react';
import { OrbitService, type Product } from '../../shared/services/orbit.service';
import { Check, ShieldCheck, ShieldAlert } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export const SubscriptionPage = () => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingInterval, setBillingInterval] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  useEffect(() => {
    const loadPlans = async () => {
      try {
        // Hardcoded slug 'barberflow' for this SaaS.
        const data = await OrbitService.getPlans('barberflow');
        setProduct(data);
      } catch (error) {
        console.error('Failed to load plans', error);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  const toggleBilling = () =>
    setBillingInterval((prev) => (prev === 'MONTHLY' ? 'YEARLY' : 'MONTHLY'));

  if (loading)
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-leather-700"></div>
      </div>
    );

  if (!product)
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-chrome-400">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-4" />
        <p>Não foi possível carregar os planos. Tente novamente mais tarde.</p>
      </div>
    );

  const filteredPlans = product.plans.filter((p) => p.interval === billingInterval && p.isActive);

  return (
    <div className="max-w-7xl mx-auto font-sans p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 bg-shop-800/30 p-8 rounded-lg border border-leather-800/20 backdrop-blur-sm">
        <div>
          <h1 className="text-4xl font-serif font-bold text-chrome-100 mb-3 tracking-tight">
            Gerenciar Assinatura
          </h1>
          <p className="text-chrome-400 text-lg max-w-2xl">
            Escolha o nível de exclusividade ideal para o seu estabelecimento.
          </p>
        </div>

        {/* Custom Toggle */}
        {/* Custom Toggle (Grid Layout) */}
        <div className="bg-shop-900 border border-leather-800/50 p-1.5 rounded-[4px] inline-flex relative w-64 h-12 select-none shadow-inner">
          {/* The sliding pill */}
          <div
            className={cn(
              'absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-leather-700 rounded-[2px] shadow-md transition-all duration-300 ease-out',
              billingInterval === 'MONTHLY' ? 'left-1.5' : 'left-[calc(50%+3px)]',
            )}
          />

          {/* Clickable Area: Monthly */}
          <button
            onClick={() => setBillingInterval('MONTHLY')}
            className={cn(
              'flex-1 relative z-10 font-bold uppercase tracking-wider text-sm transition-colors duration-300 flex items-center justify-center rounded-[2px]',
              billingInterval === 'MONTHLY'
                ? 'text-white'
                : 'text-chrome-500 hover:text-chrome-300',
            )}
          >
            Mensal
          </button>

          {/* Clickable Area: Yearly */}
          <button
            onClick={() => setBillingInterval('YEARLY')}
            className={cn(
              'flex-1 relative z-10 font-bold uppercase tracking-wider text-sm transition-colors duration-300 flex items-center justify-center rounded-[2px]',
              billingInterval === 'YEARLY' ? 'text-white' : 'text-chrome-500 hover:text-chrome-300',
            )}
          >
            Anual
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'relative group flex flex-col p-8 rounded-sm transition-all duration-300 border bg-shop-800',
              'hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50',
              plan.name.toLowerCase().includes('pro') || plan.name.toLowerCase().includes('premium')
                ? 'border-leather-700/50 shadow-lg shadow-leather-900/20'
                : 'border-leather-800/30 border-t-white/5',
            )}
          >
            {/* Gradient Overlay for Hover */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-sm" />

            {/* Header */}
            <div className="mb-6 relative z-10">
              <h3 className="text-2xl font-serif font-bold text-chrome-100 mb-2">{plan.name}</h3>
              {plan.interval === 'YEARLY' && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-leather-500 bg-leather-900/30 border border-leather-800/50 rounded-sm mb-2">
                  Economia de 20%
                </span>
              )}
            </div>

            {/* Price */}
            <div className="mb-8 p-6 bg-shop-900/50 rounded-sm border border-leather-800/20 relative z-10">
              <span className="block text-chrome-400 text-xs uppercase tracking-widest font-bold mb-1">
                Investimento
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-chrome-500 font-serif">R$</span>
                <span className="text-5xl font-bold text-chrome-100 tracking-tighter">
                  {Number(plan.price).toFixed(2)}
                </span>
                <span className="text-chrome-500 text-sm font-medium">
                  /{plan.interval === 'MONTHLY' ? 'mês' : 'ano'}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-4 mb-8 flex-grow relative z-10">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                  <div className="mt-0.5 p-0.5 rounded-full bg-leather-900/50 border border-leather-700/30 group-hover/item:border-leather-500/50 transition-colors">
                    <Check className="w-3.5 h-3.5 text-leather-500" />
                  </div>
                  <span className="text-sm text-chrome-300 leading-snug">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Action */}
            <button
              className={cn(
                'w-full py-4 rounded-sm font-bold uppercase tracking-wider text-sm transition-all relative z-10',
                'border border-white/5 shadow-lg active:translate-y-[1px]',
                plan.name.toLowerCase().includes('pro')
                  ? 'bg-leather-700 text-white hover:bg-leather-600 shadow-leather-900/50'
                  : 'bg-shop-700 text-chrome-200 hover:bg-shop-600 hover:text-white',
              )}
            >
              Escolher Plano
            </button>
          </div>
        ))}

        {filteredPlans.length === 0 && (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-center border border-dashed border-leather-800/30 rounded-sm bg-shop-800/20">
            <ShieldCheck className="w-12 h-12 text-leather-800 mb-4 opacity-50" />
            <p className="text-chrome-500 font-serif text-lg">
              Nenhum plano disponível para este ciclo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
