import { CheckCircle2, Store, MapPin, Map, KeyRound } from 'lucide-react';
import { useOnboardingStore } from '../store/onboarding.store';

const STEPS = [
  { id: 1, title: 'Dados do Negócio', icon: Store },
  { id: 2, title: 'Endereço', icon: MapPin },
  { id: 3, title: 'Localização', icon: Map },
  { id: 4, title: 'Licença & Acesso', icon: KeyRound },
];

export function StepIndicator() {
  const { step } = useOnboardingStore();

  return (
    <div className="flex justify-between mb-8 relative">
      <div className="absolute top-1/2 left-0 w-full h-1 bg-leather-800/30 -z-10 -translate-y-1/2 rounded-full"></div>
      {STEPS.map((s) => {
        const isActive = s.id === step;
        const isCompleted = s.id < step;

        return (
          <div key={s.id} className="flex flex-col items-center gap-2 bg-shop-900 p-4">
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
  );
}
