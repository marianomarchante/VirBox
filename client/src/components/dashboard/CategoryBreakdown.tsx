import { useQuery } from "@tanstack/react-query";
import { Tag } from "lucide-react";

export default function CategoryBreakdown() {
  const { data: transactions = [] } = useQuery<any[]>({
    queryKey: ['/api/transactions'],
  });

  // Calculate expense categories from real data
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  
  const categoryTotals = expenseTransactions.reduce((acc: any, transaction: any) => {
    const category = transaction.category || 'Sin categoría';
    const amount = parseFloat(transaction.amount || 0);
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += amount;
    return acc;
  }, {});

  const totalExpenses = Object.values(categoryTotals).reduce((sum: number, amount: any) => sum + amount, 0);

  const categories = Object.entries(categoryTotals)
    .map(([name, amount]: [string, any]) => ({
      name,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="category-breakdown">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Gastos por Categoría</h3>
        <p className="text-sm text-muted-foreground">Resumen del mes</p>
      </div>
      
      {categories.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">No hay gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category, index) => {
            const colors = [
              { text: 'text-primary', bg: 'bg-primary' },
              { text: 'text-secondary', bg: 'bg-secondary' },
              { text: 'text-accent', bg: 'bg-accent' },
              { text: 'text-chart-1', bg: 'bg-chart-1' },
              { text: 'text-chart-2', bg: 'bg-chart-2' }
            ];
            const color = colors[index % colors.length];
            
            return (
              <div key={category.name} data-testid={`category-${category.name.toLowerCase()}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className={color.text} size={16} />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm font-semibold" data-testid={`category-${category.name.toLowerCase()}-amount`}>
                    {formatCurrency(category.amount)}
                  </span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-2">
                  <div 
                    className={`${color.bg} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${category.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {category.percentage}% del total
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
