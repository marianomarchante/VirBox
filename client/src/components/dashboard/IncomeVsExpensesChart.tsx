import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  month: string;
  income: number;
  expenses: number;
}

interface IncomeVsExpensesChartProps {
  data: ChartData[];
}

export default function IncomeVsExpensesChart({ data }: IncomeVsExpensesChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="lg:col-span-2 bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ingresos vs Gastos</h3>
          <p className="text-sm text-muted-foreground">Comparativa mensual 2024</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg">
            Mensual
          </button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg">
            Trimestral
          </button>
          <button className="px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-lg">
            Anual
          </button>
        </div>
      </div>
      
      <div className="h-64" data-testid="income-vs-expenses-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={formatCurrency}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === 'income' ? 'Ingresos' : 'Gastos'
              ]}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend 
              formatter={(value) => value === 'income' ? 'Ingresos' : 'Gastos'}
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar 
              dataKey="income" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="income"
            />
            <Bar 
              dataKey="expenses" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
              name="expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
