import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // Keep zod imports
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Loader2, Store, MapPin, KeyRound, CheckCircle2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button'; // Verify path
import { useBarbershopStore } from './barbershop.store'; // Verify path
import { ibgeService, type UF, type City } from '@/shared/services/ibge'; // Verify path

// Steps
const STEPS = [
  { id: 1, title: 'Dados do Negócio', icon: Store },
  { id: 2, title: 'Localização', icon: MapPin },
  { id: 3, title: 'Licença & Acesso', icon: KeyRound },
];

const schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  state: z.string().min(2, 'Selecione um estado'),
  city: z.string().min(2, 'Selecione uma cidade'),
  zipCode: z.string().optional(),
  licenseKey: z.string().min(5, 'Chave inválida'),
});

type FormData = z.infer<typeof schema>;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { updateBarbershop, isLoading } = useBarbershopStore();
  const [step, setStep] = useState(1);
  const [states, setStates] = useState<UF[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      cnpj: '',
      phone: '',
      address: '',
      state: '',
      city: '',
      licenseKey: '',
    },
  });

  const selectedState = watch('state');

  useEffect(() => {
    ibgeService.getStates().then(setStates);
  }, []);

  useEffect(() => {
    if (selectedState) {
      ibgeService.getCities(selectedState).then(setCities);
    }
  }, [selectedState]);

  const onSubmit = async (data: FormData) => {
    // Final submit
    await updateBarbershop(data);
    navigate('/'); // Go to home after onboarding
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen bg-shop-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="w-full max-w-2xl z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display text-chrome-100 mb-3">Bem-vindo ao BarberFlow</h1>
          <p className="text-chrome-400 text-lg">Vamos configurar o ambiente da sua barbearia</p>
        </div>

        {/* Stepper */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-leather-800/30 -z-10 -translate-y-1/2 rounded-full"></div>
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isCompleted = s.id < step;

            return (
              <div key={s.id} className="flex flex-col items-center gap-2 bg-shop-900 px-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                 ${
                                   isActive
                                     ? 'border-leather-500 text-leather-500 bg-leather-500/10'
                                     : isCompleted
                                       ? 'border-green-500 text-green-500 bg-green-500/10'
                                       : 'border-chrome-700 text-chrome-700'
                                 }
                             `}
                >
                  {isCompleted ? <CheckCircle2 size={24} /> : <s.icon size={24} />}
                </div>
                <span
                  className={`text-sm font-medium ${isActive ? 'text-chrome-100' : 'text-chrome-500'}`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Form Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-shop-800/50 backdrop-blur-sm border border-leather-800/30 rounded-lg p-8 shadow-xl"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Business Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-chrome-300 mb-1">
                    Nome da Barbearia
                  </label>
                  <input
                    {...register('name')}
                    placeholder="Ex: Flavinho Cuts"
                    className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-chrome-300 mb-1">
                      CNPJ (Opcional)
                    </label>
                    <input
                      {...register('cnpj')}
                      placeholder="00.000.000/0000-00"
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-chrome-300 mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      {...register('phone')}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-chrome-300 mb-1">Estado</label>
                    <select
                      {...register('state')}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none appearance-none"
                    >
                      <option value="">Selecione...</option>
                      {states.map((uf) => (
                        <option key={uf.id} value={uf.sigla}>
                          {uf.nome}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-chrome-300 mb-1">Cidade</label>
                    <select
                      {...register('city')}
                      disabled={!selectedState}
                      className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none appearance-none disabled:opacity-50"
                    >
                      <option value="">Selecione...</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.nome}>
                          {city.nome}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-chrome-300 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    {...register('address')}
                    placeholder="Rua, Número, Bairro"
                    className="w-full bg-shop-900 border border-leather-800/30 rounded-md px-4 py-3 text-chrome-100 focus:border-leather-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: License */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-leather-900/40 to-shop-900 border border-leather-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-chrome-50 mb-2">Ativar Licença</h3>
                  <p className="text-chrome-400 text-sm mb-4">
                    Insira sua chave de licença para desbloquear todas as funcionalidades do
                    sistema.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-chrome-300 mb-1">
                      License Key
                    </label>
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
                      <p className="text-red-500 text-sm mt-1">{errors.licenseKey.message}</p>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <a href="#" className="text-sm text-leather-500 hover:text-leather-400 underline">
                    Ainda não tem uma licença? Compre aqui.
                  </a>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-6 border-t border-leather-800/20">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Voltar
                </Button>
              ) : (
                <div></div>
              )}

              {step < 3 ? (
                <Button type="button" variant="default" onClick={nextStep}>
                  Próximo
                </Button>
              ) : (
                <Button type="submit" variant="default" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin mr-2" size={18} />
                      Configurando...
                    </>
                  ) : (
                    'Finalizar Configuração'
                  )}
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
