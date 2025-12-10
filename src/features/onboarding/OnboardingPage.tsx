import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useBarbershopStore } from '@/features/shop-management/barbershop.store';
import { Button } from '@/shared/ui/Button';
import { useOnboardingStore } from './store/onboarding.store';
import { StepIndicator } from './components/StepIndicator';

import { BusinessInfoStep } from './components/BusinessInfoStep';
import { AddressStep } from './components/AddressStep';
import { LocationMapStep } from './components/LocationMapStep';
import { LicenseStep } from './components/LicenseStep';

const schema = z.object({
  name: z.string().min(3, 'Nome muito curto'),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().min(5, 'Endereço obrigatório'),
  number: z.string().min(1, 'Número obrigatório'),
  neighborhood: z.string().min(3, 'Bairro obrigatório'),
  complement: z.string().optional(),
  state: z.string().min(2, 'Selecione um estado'),
  city: z.string().min(2, 'Selecione uma cidade'),
  zipCode: z.string().min(8, 'CEP obrigatório'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  licenseKey: z.string().min(5, 'Chave inválida'),
});

export type OnboardingFormData = z.infer<typeof schema>;

export function OnboardingPage() {
  const navigate = useNavigate();
  const { updateBarbershop, isLoading } = useBarbershopStore();
  const { step, nextStep, prevStep } = useOnboardingStore();

  const methods = useForm<OnboardingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      cnpj: '',
      phone: '',
      address: '',
      number: '',
      neighborhood: '',
      complement: '',
      zipCode: '',
      state: '',
      city: '',
      licenseKey: '',
    },
    mode: 'onChange',
  });

  const { handleSubmit, trigger, setValue } = methods;

  const handleNext = async () => {
    let fieldsToValidate: (keyof OnboardingFormData)[] = [];

    if (step === 1) fieldsToValidate = ['name']; // CNPJ/Phone optional
    if (step === 2)
      fieldsToValidate = ['zipCode', 'state', 'city', 'address', 'number', 'neighborhood'];
    if (step === 3) fieldsToValidate = []; // Map optional? Or check lat/lng? Schema says optional but UI warns.

    // For step 3, we might want to ensure lat/lng are set if we made them required in UI?
    // Schema says optional, so we skip rigid validation here or add manual check if desired.

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      nextStep();
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      await updateBarbershop(data);
      toast.success('Configuração concluída com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar configurações.');
    }
  };

  const handleTrial = async () => {
    setValue('licenseKey', 'TRIAL-VERSION');
    await handleSubmit(onSubmit)();
  };

  return (
    <div className="min-h-screen bg-shop-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="w-full max-w-2xl z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display text-chrome-100 mb-3">Bem-vindo ao BarberFlow</h1>
          <p className="text-chrome-400 text-lg">Vamos configurar o ambiente da sua barbearia</p>
        </div>

        <StepIndicator />

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-shop-800/50 backdrop-blur-sm border border-leather-800/30 rounded-lg p-8 shadow-xl"
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {step === 1 && <BusinessInfoStep />}
              {step === 2 && <AddressStep />}
              {step === 3 && <LocationMapStep />}
              {step === 4 && <LicenseStep onTrialSelect={handleTrial} />}

              {/* Actions */}
              <div className="flex justify-between pt-6 border-t border-leather-800/20 relative z-10 mt-8">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Voltar
                  </Button>
                ) : (
                  <div></div>
                )}

                {step < 4 ? (
                  <Button type="button" variant="default" onClick={handleNext}>
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
          </FormProvider>
        </motion.div>
      </div>
    </div>
  );
}
