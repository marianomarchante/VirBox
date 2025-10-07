import { TrendingUp, TrendingDown, Wallet, Clock } from "lucide-react";

interface MetricsGridProps {
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  };
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Ingresos",
      amount: metrics.totalIncome,
      change: "+12.5%",
      icon: TrendingUp,
      color: "primary",
      testId: "metric-total-income"
    },
    {
      title: "Total Gastos",
      amount: metrics.totalExpenses,
      change: "-8.3%",
      icon: TrendingDown,
      color: "destructive",
      testId: "metric-total-expenses"
    },
    {
      title: "Balance Mes",
      amount: metrics.balance,
      change: "+38.2%",
      icon: Wallet,
      color: "secondary",
      testId: "metric-balance"
    },
    {
      title: "Pagos Pendientes",
      amount: metrics.pendingPayments,
      change: "5 items",
      icon: Clock,
      color: "accent",
      testId: "metric-pending-payments"
    }
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string, text: string, badgeBg: string }> = {
      primary: { bg: 'bg-primary/10', text: 'text-primary', badgeBg: 'bg-primary/10' },
      destructive: { bg: 'bg-destructive/10', text: 'text-destructive', badgeBg: 'bg-destructive/10' },
      secondary: { bg: 'bg-secondary/10', text: 'text-secondary', badgeBg: 'bg-secondary/10' },
      accent: { bg: 'bg-accent/10', text: 'text-accent', badgeBg: 'bg-accent/10' }
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);
        return (
          <div key={card.title} className="metric-card" data-testid={card.testId}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={colors.text} size={20} />
              </div>
              <span className={`text-xs font-medium ${colors.text} ${colors.badgeBg} px-2 py-1 rounded`}>
                {card.change}
              </span>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-foreground" data-testid={`${card.testId}-amount`}>
              {formatCurrency(card.amount)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">vs mes anterior</p>
          </div>
        );
      })}
    </div>
  );
}
