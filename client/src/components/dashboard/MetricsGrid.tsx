import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface MetricsGridProps {
  metrics: {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
  };
}

export default function MetricsGrid({ metrics }: MetricsGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const cards = [
    {
      title: "Total Ingresos",
      amount: metrics.totalIncome,
      icon: TrendingUp,
      color: "primary",
      testId: "metric-total-income"
    },
    {
      title: "Total Gastos",
      amount: metrics.totalExpenses,
      icon: TrendingDown,
      color: "destructive",
      testId: "metric-total-expenses"
    },
    {
      title: "Balance Mes",
      amount: metrics.balance,
      icon: Wallet,
      color: "secondary",
      testId: "metric-balance"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const colors = getColorClasses(card.color);
        return (
          <div key={card.title} className="metric-card" data-testid={card.testId}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                <Icon className={colors.text} size={20} />
              </div>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-foreground" data-testid={`${card.testId}-amount`}>
              {formatCurrency(card.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
