import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/shared/ui/Button';

interface BookingSummaryProps {
  serviceName?: string;
  price?: number;
  barberName?: string;
  date?: Date | null;
  time?: string | null;
  onConfirm: () => void;
  loading?: boolean;
}

export function BookingSummary({
  serviceName,
  price,
  barberName,
  date,
  time,
  onConfirm,
  loading,
}: BookingSummaryProps) {
  return (
    <div className="space-y-6 bg-shop-800/50 p-6 border border-leather-800 rounded-sm">
      <h3 className="font-serif text-2xl text-chrome-100 border-b border-leather-800 pb-4">
        Resumo do Agendamento
      </h3>

      <div className="space-y-4">
        <SummaryItem label="Serviço" value={serviceName} />
        <SummaryItem
          label="Profissional"
          value={barberName || 'Qualquer profissional disponível'}
        />
        <SummaryItem
          label="Data"
          value={date ? format(date, "d 'de' MMMM, yyyy", { locale: ptBR }) : '-'}
        />
        <SummaryItem label="Horário" value={time} />

        <div className="pt-4 border-t border-leather-800 flex justify-between items-end">
          <span className="text-chrome-400 text-sm uppercase tracking-widest">Total</span>
          <span className="text-2xl font-serif text-leather-500 font-bold">
            R$ {price?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>

      <Button onClick={onConfirm} disabled={loading} className="w-full text-lg h-14" size="lg">
        {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
      </Button>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-chrome-400 uppercase tracking-widest">{label}</span>
      <span className="text-chrome-100 font-medium">{value || '-'}</span>
    </div>
  );
}
