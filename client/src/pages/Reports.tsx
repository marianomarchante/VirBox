import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useTransactions } from "@/hooks/use-transactions";

export default function Reports() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  const { transactions } = useTransactions({
    search: '',
    type: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const { data: metrics } = useQuery<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }>({
    queryKey: ['/api/dashboard/metrics'],
  });

  const { data: monthlyData = [] } = useQuery<Array<{
    month: string;
    income: number;
    expenses: number;
  }>>({
    queryKey: ['/api/dashboard/monthly-data'],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Process data for category breakdown
  const categoryData = transactions?.reduce((acc, transaction) => {
    if (transaction.type === 'expense') {
      const category = transaction.category;
      const amount = parseFloat(transaction.amount);
      acc[category] = (acc[category] || 0) + amount;
    }
    return acc;
  }, {} as Record<string, number>);

  const categoryChartData = Object.entries(categoryData || {}).map(([name, value]) => ({
    name,
    value,
  }));

  // Process data for monthly trends
  const monthlyTrends = monthlyData.map((month: any) => ({
    ...month,
    profit: month.income - month.expenses,
  }));

  // Chart colors
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', 'hsl(var(--destructive))'];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Reportes"
          subtitle="Análisis financiero y estadísticas"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        
        <div className="p-4 lg:p-8 space-y-6">
          {/* Report Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={reportType} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setReportType(value)}>
                <SelectTrigger className="w-40" data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensual</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">2024</span>
              </div>
            </div>
            
            <Button data-testid="button-export-report">
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </Button>
          </div>

          {/* Key Metrics Cards */}
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(metrics.totalIncome)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% vs mes anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(metrics.totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    -8.3% vs mes anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ganancia Neta</CardTitle>
                  <DollarSign className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    {formatCurrency(metrics.balance)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +38.2% vs mes anterior
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
                  <Package className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {transactions?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total este mes
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Monthly Trends Chart */}
            <Card data-testid="monthly-trends-chart">
              <CardHeader>
                <CardTitle>Tendencias Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={formatCurrency}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          formatCurrency(value),
                          name === 'income' ? 'Ingresos' : name === 'expenses' ? 'Gastos' : 'Ganancia'
                        ]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="income" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="income"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="expenses" 
                        stroke="hsl(var(--destructive))" 
                        strokeWidth={2}
                        name="expenses"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        name="profit"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown Pie Chart */}
            <Card data-testid="category-breakdown-chart">
              <CardHeader>
                <CardTitle>Gastos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {categoryChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                      <span className="text-sm font-medium ml-auto">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Income vs Expenses Comparison */}
          <Card data-testid="income-expenses-comparison">
            <CardHeader>
              <CardTitle>Comparativa Ingresos vs Gastos - 2024</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'income' ? 'Ingresos' : 'Gastos'
                      ]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
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
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Estadístico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {monthlyData.reduce((sum: number, month: any) => sum + month.income, 0).toLocaleString('es-ES', { 
                      style: 'currency', 
                      currency: 'USD',
                      minimumFractionDigits: 0 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Ingresos Anuales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {monthlyData.reduce((sum: number, month: any) => sum + month.expenses, 0).toLocaleString('es-ES', { 
                      style: 'currency', 
                      currency: 'USD',
                      minimumFractionDigits: 0 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Gastos Anuales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">
                    {monthlyData.reduce((sum: number, month: any) => sum + (month.income - month.expenses), 0).toLocaleString('es-ES', { 
                      style: 'currency', 
                      currency: 'USD',
                      minimumFractionDigits: 0 
                    })}
                  </p>
                  <p className="text-sm text-muted-foreground">Ganancia Anual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
