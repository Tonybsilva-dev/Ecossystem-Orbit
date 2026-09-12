import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, X, Clock, User, Scissors } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// Mock Data
const MOCK_APPOINTMENTS = [
  {
    id: '1',
    clientName: 'João Silva',
    service: 'Corte Clássico',
    barber: 'Flavinho',
    date: new Date(2025, 4, 20, 14, 30),
    status: 'PENDING',
    price: 60,
  },
  {
    id: '2',
    clientName: 'Pedro Santos',
    service: 'Barba Terapia',
    barber: 'Carlos Tesoura',
    date: new Date(2025, 4, 20, 15, 0),
    status: 'CONFIRMED',
    price: 45,
  },
  {
    id: '3',
    clientName: 'Mario Costa',
    service: 'Combo Completo',
    barber: 'João Navalha',
    date: new Date(2025, 4, 20, 16, 15),
    status: 'COMPLETED',
    price: 95,
  },
];

export function AppointmentsList() {
  const [appointments, setAppointments] = useState(MOCK_APPOINTMENTS);

  const handleStatusChange = (id: string, newStatus: string) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt)),
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'CONFIRMED':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'COMPLETED':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'CANCELLED':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-chrome-400 bg-shop-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-serif text-chrome-100 font-bold mb-1">Agendamentos</h2>
          <p className="text-chrome-400 text-sm">Gerencie os horários da barbearia</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-leather-700 text-white rounded-sm hover:bg-leather-600 transition-colors text-sm font-medium">
            Novo Agendamento
          </button>
        </div>
      </div>

      <div className="bg-shop-800/30 border border-leather-800/30 rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-shop-900 border-b border-leather-800/30 text-xs uppercase text-chrome-400 tracking-wider">
              <th className="p-4 font-medium">Cliente</th>
              <th className="p-4 font-medium">Serviço</th>
              <th className="p-4 font-medium">Profissional</th>
              <th className="p-4 font-medium">Data & Hora</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-leather-800/10">
            {appointments.map((apt) => (
              <tr key={apt.id} className="hover:bg-shop-800/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-shop-700 flex items-center justify-center text-chrome-300">
                      <User size={14} />
                    </div>
                    <span className="font-medium text-chrome-200">{apt.clientName}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-chrome-300">
                    <Scissors size={14} className="text-leather-600" />
                    <span>{apt.service}</span>
                  </div>
                </td>
                <td className="p-4 text-chrome-400">{apt.barber}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-chrome-300">
                    <Clock size={14} className="text-leather-600" />
                    <span>{format(apt.date, "d 'de' MMM, HH:mm", { locale: ptBR })}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-bold border',
                      getStatusColor(apt.status),
                    )}
                  >
                    {apt.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                      className="p-1 rounded hover:bg-green-900/30 text-chrome-400 hover:text-green-500 transition-colors"
                      title="Concluir"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={() => handleStatusChange(apt.id, 'CANCELLED')}
                      className="p-1 rounded hover:bg-red-900/30 text-chrome-400 hover:text-red-500 transition-colors"
                      title="Cancelar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
