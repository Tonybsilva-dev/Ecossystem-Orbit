import { useEffect, useState } from 'react';
import { DollarSign, Calendar, Users, TrendingUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface KPI {
  label: string;
  value: number;
  type: 'currency' | 'number';
  change: string;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
}

interface DashboardData {
  kpis: KPI[];
  recentActivity: Activity[];
}

export function DashboardHome() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await fetch('/api/barbershop/dashboard');
        if (!response.ok) throw new Error('Failed to fetch data');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-leather-500" size={32} />
      </div>
    );
  }

  const getIcon = (label: string) => {
    switch (label) {
      case 'Faturamento Hoje':
        return DollarSign;
      case 'Agendamentos':
        return Calendar;
      case 'Novos Clientes':
        return Users;
      default:
        return TrendingUp;
    }
  };

  const formatValue = (value: number, type: 'currency' | 'number') => {
    if (type === 'currency')
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    return value.toString();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.kpis.map((kpi, index) => {
          const Icon = getIcon(kpi.label);
          return (
            <div key={index} className="bg-shop-800/50 border border-leather-800/30 p-6 rounded-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-shop-900 rounded-sm text-leather-500 border border-leather-800/30">
                  <Icon size={24} />
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-900/20 px-2 py-1 rounded-full">
                  {kpi.change}
                </span>
              </div>
              <h3 className="text-chrome-400 text-sm uppercase tracking-wider mb-1">{kpi.label}</h3>
              <p className="text-2xl font-serif text-chrome-100 font-bold">
                {formatValue(kpi.value, kpi.type)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-shop-800/30 border border-leather-800/30 p-6 rounded-sm">
          <h3 className="font-serif text-lg text-chrome-100 mb-4 border-b border-leather-800/30 pb-2">
            Atividade Recente
          </h3>
          <div className="space-y-4">
            {data?.recentActivity.length === 0 && (
              <p className="text-chrome-500 text-sm text-center py-4">Nenhuma atividade recente.</p>
            )}
            {data?.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 py-2 border-b border-leather-800/10 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-shop-900 flex items-center justify-center text-chrome-400">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-sm text-chrome-200">
                    <span className="font-bold text-white">{activity.user}</span> {activity.action}
                  </p>
                  <p className="text-xs text-chrome-500">
                    {formatDistanceToNow(new Date(activity.time), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions (Keep Mock/Static for now) */}
        <div className="bg-shop-800/30 border border-leather-800/30 p-6 rounded-sm">
          <h3 className="font-serif text-lg text-chrome-100 mb-4 border-b border-leather-800/30 pb-2">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-shop-900 border border-leather-800/30 rounded-sm hover:border-leather-500 transition-colors text-left group">
              <Calendar className="mb-2 text-leather-700 group-hover:text-leather-500" />
              <span className="text-sm font-medium text-chrome-200">Novo Agendamento</span>
            </button>
            <button className="p-4 bg-shop-900 border border-leather-800/30 rounded-sm hover:border-leather-500 transition-colors text-left group">
              <Users className="mb-2 text-leather-700 group-hover:text-leather-500" />
              <span className="text-sm font-medium text-chrome-200">Cadastrar Cliente</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
