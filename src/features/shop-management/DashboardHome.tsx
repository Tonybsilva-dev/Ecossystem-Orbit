import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react';

export function DashboardHome() {
  const kpis = [
    { label: 'Faturamento Hoje', value: 'R$ 1.250,00', icon: DollarSign, change: '+12%' },
    { label: 'Agendamentos', value: '18', icon: Calendar, change: '+5%' },
    { label: 'Novos Clientes', value: '4', icon: Users, change: '+2%' },
    { label: 'Ticket Médio', value: 'R$ 69,00', icon: TrendingUp, change: '0%' },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
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
              <p className="text-2xl font-serif text-chrome-100 font-bold">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity Mock */}
        <div className="bg-shop-800/30 border border-leather-800/30 p-6 rounded-sm">
          <h3 className="font-serif text-lg text-chrome-100 mb-4 border-b border-leather-800/30 pb-2">
            Atividade Recente
          </h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-2 border-b border-leather-800/10 last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-shop-900 flex items-center justify-center text-chrome-400">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-sm text-chrome-200">
                    <span className="font-bold text-white">João Silva</span> agendou Corte Clássico
                  </p>
                  <p className="text-xs text-chrome-500">Há 15 minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Mock */}
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
