import { TrendingUp, TrendingDown } from "lucide-react";
import type { Transaction } from "@shared/schema";

interface RecentTransactionsProps {
  transactions: Transaction[];
  title: string;
  type: 'income' | 'expense';
}

export default function RecentTransactions({ transactions, title, type }: RecentTransactionsProps) {
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Ventas': '🌾',
      'Semillas': '🌱',
      'Fertilizantes': '🧪',
      'Mano de Obra': '👥',
      'Maquinaria': '🚜',
    };
    return icons[category] || '📦';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Ventas': 'primary',
      'Semillas': 'primary',
      'Fertilizantes': 'destructive',
      'Mano de Obra': 'accent',
      'Maquinaria': 'muted',
    };
    return colors[category] || 'muted';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">Últimas 5 transacciones</p>
        </div>
        <button 
          className="text-sm font-medium text-primary hover:underline"
          data-testid={`view-all-${type}`}
        >
          Ver todos
        </button>
      </div>
      
      <div className="space-y-4" data-testid={`recent-${type}-list`}>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay transacciones recientes</p>
          </div>
        ) : (
          transactions.slice(0, 5).map((transaction) => {
            const colorMap: Record<string, string> = {
              primary: 'bg-primary/10',
              destructive: 'bg-destructive/10',
              accent: 'bg-accent/10',
              muted: 'bg-muted/10'
            };
            const bgColor = colorMap[getCategoryColor(transaction.category)] || 'bg-muted/10';
            
            return (
              <div 
                key={transaction.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/10 transition-colors"
                data-testid={`transaction-${transaction.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <span className="text-lg">{getCategoryIcon(transaction.category)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{transaction.concept}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                    {type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                  {transaction.quantity && (
                    <p className="text-xs text-muted-foreground">{transaction.quantity}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
