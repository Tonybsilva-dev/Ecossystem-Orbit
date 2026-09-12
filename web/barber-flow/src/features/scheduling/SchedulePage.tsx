import { useBookingStore } from './booking.store';
import { ServiceCard } from './components/ServiceCard';
import { BarberCard } from './components/BarberCard';
import { BookingCalendar } from './components/BookingCalendar';
import { TimeSlotPicker } from './components/TimeSlotPicker';
import { BookingSummary } from './components/BookingSummary';
import { Button } from '@/shared/ui/Button';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data (In reality, fetch from Supabase/Prisma)
const SERVICES = [
  { id: '1', name: 'Corte Clássico', price: 60, duration: 45 },
  { id: '2', name: 'Barba Terapia', price: 45, duration: 30 },
  { id: '3', name: 'Combo Completo', price: 95, duration: 75 },
  { id: '4', name: 'Pézinho & Acabamento', price: 30, duration: 20 },
];

const BARBERS = [
  { id: '1', name: 'Flavinho', specialties: ['Corte', 'Barba'] },
  { id: '2', name: 'João Navalha', specialties: ['Degradê', 'Desenho'] },
  { id: '3', name: 'Carlos Tesoura', specialties: ['Clássico'] },
];

const TIME_SLOTS = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '13:00',
  '13:45',
  '14:30',
  '15:15',
  '16:00',
  '16:45',
  '17:30',
  '18:15',
];

export function SchedulePage() {
  const {
    step,
    selectedServiceId,
    selectedBarberId,
    selectedDate,
    selectedTimeSlot,
    setService,
    setBarber,
    setDate,
    setTimeSlot,
    nextStep,
    prevStep,
    reset,
  } = useBookingStore();

  const handleConfirm = () => {
    // Submit to backend
    alert('Agendamento Confirmado! (Mock)');
    reset();
  };

  const selectedService = SERVICES.find((s) => s.id === selectedServiceId);
  const selectedBarber = BARBERS.find((b) => b.id === selectedBarberId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header / Progress */}
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-serif text-chrome-100 mb-2">Agende seu Estilo</h1>
        <div className="flex justify-center items-center gap-2 text-sm text-chrome-400">
          <span className={step >= 1 ? 'text-leather-500 font-bold' : ''}>1. Serviço</span>
          <span className="w-8 h-[1px] bg-leather-800"></span>
          <span className={step >= 2 ? 'text-leather-500 font-bold' : ''}>2. Profissional</span>
          <span className="w-8 h-[1px] bg-leather-800"></span>
          <span className={step >= 3 ? 'text-leather-500 font-bold' : ''}>3. Data & Hora</span>
          <span className="w-8 h-[1px] bg-leather-800"></span>
          <span className={step >= 4 ? 'text-leather-500 font-bold' : ''}>4. Resumo</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid sm:grid-cols-2 gap-4"
              >
                {SERVICES.map((service) => (
                  <ServiceCard
                    key={service.id}
                    {...service}
                    selected={selectedServiceId === service.id}
                    onClick={() => {
                      setService(service.id);
                      nextStep();
                    }}
                  />
                ))}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid sm:grid-cols-3 gap-4"
              >
                <BarberCard
                  id="any"
                  name="Qualquer Profissional"
                  specialties={['Disponibilidade Rápida']}
                  selected={selectedBarberId === 'any'}
                  onClick={() => {
                    setBarber('any');
                    nextStep();
                  }}
                />
                {BARBERS.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    {...barber}
                    selected={selectedBarberId === barber.id}
                    onClick={() => {
                      setBarber(barber.id);
                      nextStep();
                    }}
                  />
                ))}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-chrome-100 font-medium mb-4 uppercase tracking-wider text-sm">
                      Selecione uma Data
                    </h3>
                    <BookingCalendar selectedDate={selectedDate} onSelect={setDate} />
                  </div>
                  <div>
                    <h3 className="text-chrome-100 font-medium mb-4 uppercase tracking-wider text-sm">
                      Horários Disponíveis
                    </h3>
                    {selectedDate ? (
                      <TimeSlotPicker
                        slots={TIME_SLOTS}
                        selectedSlot={selectedTimeSlot}
                        onSelect={(time) => {
                          setTimeSlot(time);
                          nextStep();
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-chrome-400 italic bg-shop-800/20 border border-leather-800/20 rounded-sm">
                        Selecione uma data primeiro
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-green-900/10 border border-green-900/30 p-8 rounded-sm text-center"
              >
                <CheckCircle2 size={64} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl text-chrome-100 font-serif mb-2">Quase lá!</h2>
                <p className="text-chrome-400">
                  Revise os detalhes ao lado e confirme seu agendamento.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {step > 1 && (
            <div className="mt-8">
              <Button variant="ghost" onClick={prevStep} className="pl-0 gap-2">
                <ChevronLeft size={16} /> Voltar
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="bg-shop-800/10 p-1">
          <BookingSummary
            serviceName={selectedService?.name}
            price={selectedService?.price}
            barberName={selectedBarberId === 'any' ? undefined : selectedBarber?.name}
            date={selectedDate}
            time={selectedTimeSlot}
            onConfirm={handleConfirm}
            loading={false}
          />
        </div>
      </div>
    </div>
  );
}
