import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Calendar, TrendingUp, TrendingDown, DollarSign, Package, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useTransactions } from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useLocation } from "wouter";
import { useCompany } from "@/contexts/CompanyContext";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PeriodType = 'month' | 'quarter' | 'year' | 'all';

export default function Reports() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q1');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryType, setCategoryType] = useState<'all' | 'income' | 'expense'>('all');
  
  const { hasCompanySelected } = useCompanyPermission();
  const { currentCompany } = useCompany();

  const { transactions: allTransactions } = useTransactions({
    search: '',
    type: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const { categories: incomeCategories } = useCategories('income');
  const { categories: expenseCategories } = useCategories('expense');

  // Generate available years from 1950 to current year
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1950; year--) {
      years.push(year.toString());
    }
    return years;
  }, []);

  // Filter transactions based on selected period and category
  const filteredTransactions = useMemo(() => {
    if (!allTransactions) return [];
    
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear().toString();
      const transactionMonth = transactionDate.getMonth();
      const transactionQuarter = Math.floor(transactionMonth / 3) + 1;

      // Period filter
      if (periodType === 'month') {
        if (transactionYear !== selectedYear || transactionMonth.toString() !== selectedMonth) {
          return false;
        }
      } else if (periodType === 'quarter') {
        const selectedQ = parseInt(selectedQuarter.replace('Q', ''));
        if (transactionYear !== selectedYear || transactionQuarter !== selectedQ) {
          return false;
        }
      } else if (periodType === 'year') {
        if (transactionYear !== selectedYear) {
          return false;
        }
      }
      // 'all' doesn't filter by period

      // Category filter
      if (categoryType !== 'all') {
        if (transaction.type !== categoryType) {
          return false;
        }
      }

      if (selectedCategory !== 'all' && transaction.category !== selectedCategory) {
        return false;
      }

      return true;
    });
  }, [allTransactions, periodType, selectedMonth, selectedQuarter, selectedYear, selectedCategory, categoryType]);

  // Calculate metrics from filtered transactions
  const metrics = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      pendingPayments: 0,
    };
  }, [filteredTransactions]);

  // Generate monthly data from filtered transactions
  const monthlyData = useMemo(() => {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    if (periodType === 'month') {
      // Daily data for selected month
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      return Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayTransactions = filteredTransactions.filter(t => {
          const d = new Date(t.date);
          return d.getDate() === day;
        });
        
        return {
          month: `${day}`,
          income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
          expenses: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        };
      });
    } else if (periodType === 'quarter') {
      // Monthly data for selected quarter
      const q = parseInt(selectedQuarter.replace('Q', ''));
      const startMonth = (q - 1) * 3;
      
      return [0, 1, 2].map(offset => {
        const monthIndex = startMonth + offset;
        const monthTransactions = filteredTransactions.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === monthIndex;
        });
        
        return {
          month: months[monthIndex],
          income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
          expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        };
      });
    } else if (periodType === 'year') {
      // Monthly data for selected year
      return months.map((monthName, index) => {
        const monthTransactions = filteredTransactions.filter(t => {
          const d = new Date(t.date);
          return d.getMonth() === index;
        });
        
        return {
          month: monthName,
          income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
          expenses: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        };
      });
    } else {
      // Yearly data for all years
      return availableYears.map(year => {
        const yearTransactions = filteredTransactions.filter(t => {
          const d = new Date(t.date);
          return d.getFullYear().toString() === year;
        });
        
        return {
          month: year,
          income: yearTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0),
          expenses: yearTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0),
        };
      }).reverse();
    }
  }, [periodType, selectedMonth, selectedQuarter, selectedYear, filteredTransactions, availableYears]);

  const transactions = filteredTransactions;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

  // Generate period label for display
  const getPeriodLabel = () => {
    if (periodType === 'month') {
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      return `${months[parseInt(selectedMonth)]} ${selectedYear}`;
    } else if (periodType === 'quarter') {
      return `${selectedQuarter} ${selectedYear}`;
    } else if (periodType === 'year') {
      return selectedYear;
    } else {
      return 'Todos los años';
    }
  };

  // Export report to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Informe Financiero', pageWidth / 2, 20, { align: 'center' });
    
    // Company and period
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${currentCompany?.name || 'N/A'}`, 14, 30);
    doc.text(`Período: ${getPeriodLabel()}`, 14, 36);
    
    // Filter info
    let yPos = 42;
    if (categoryType !== 'all') {
      doc.text(`Tipo: ${categoryType === 'income' ? 'Ingresos' : 'Gastos'}`, 14, yPos);
      yPos += 6;
    }
    if (selectedCategory !== 'all') {
      doc.text(`Categoría: ${selectedCategory}`, 14, yPos);
      yPos += 6;
    }
    
    yPos += 4;

    // Metrics table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Métricas', 14, yPos);
    yPos += 2;

    autoTable(doc, {
      startY: yPos,
      head: [['Métrica', 'Valor']],
      body: [
        ['Ingresos Totales', formatCurrency(metrics.totalIncome)],
        ['Gastos Totales', formatCurrency(metrics.totalExpenses)],
        ['Ganancia Neta', formatCurrency(metrics.balance)],
        ['Transacciones', transactions?.length.toString() || '0'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
    });

    // Transactions table
    yPos = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detalle de Transacciones', 14, yPos);
    
    const transactionData = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('es-ES'),
      t.description,
      t.type === 'income' ? 'Ingreso' : 'Gasto',
      t.category,
      formatCurrency(parseFloat(t.amount)),
    ]);

    autoTable(doc, {
      startY: yPos + 2,
      head: [['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Monto']],
      body: transactionData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 50 },
        2: { cellWidth: 25 },
        3: { cellWidth: 40 },
        4: { cellWidth: 30, halign: 'right' },
      },
    });

    // Category breakdown if available
    if (categoryChartData.length > 0) {
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Gastos por Categoría', 14, yPos);
      
      const categoryBreakdownData = categoryChartData.map(item => [
        item.name,
        formatCurrency(item.value),
        `${((item.value / metrics.totalExpenses) * 100).toFixed(1)}%`,
      ]);

      autoTable(doc, {
        startY: yPos + 2,
        head: [['Categoría', 'Monto', 'Porcentaje']],
        body: categoryBreakdownData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });
    }

    // Footer with date
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth - 20,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' }
      );
    }

    // Save the PDF
    const fileName = `informe_${getPeriodLabel().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  if (!hasCompanySelected) {
    return (
      <div key={`no-company-${location}`} className="flex h-screen overflow-hidden bg-background">
        <Sidebar key={`sidebar-${location}`} />
        <MobileMenu key={`mobile-${location}`} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <NoCompanySelected />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Informes"
          subtitle="Análisis financiero y estadísticas"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        
        <div className="p-4 lg:p-8 space-y-6">
          {/* Report Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filtros de Informe</h3>
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-export-pdf"
                >
                  <FileDown className="h-4 w-4" />
                  Exportar a PDF
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Period Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={periodType} onValueChange={(value: PeriodType) => setPeriodType(value)}>
                    <SelectTrigger data-testid="select-period-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Mes</SelectItem>
                      <SelectItem value="quarter">Trimestre</SelectItem>
                      <SelectItem value="year">Año</SelectItem>
                      <SelectItem value="all">Todos los años</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Month Selector (only for monthly) */}
                {periodType === 'month' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Mes</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger data-testid="select-month">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Enero</SelectItem>
                        <SelectItem value="1">Febrero</SelectItem>
                        <SelectItem value="2">Marzo</SelectItem>
                        <SelectItem value="3">Abril</SelectItem>
                        <SelectItem value="4">Mayo</SelectItem>
                        <SelectItem value="5">Junio</SelectItem>
                        <SelectItem value="6">Julio</SelectItem>
                        <SelectItem value="7">Agosto</SelectItem>
                        <SelectItem value="8">Septiembre</SelectItem>
                        <SelectItem value="9">Octubre</SelectItem>
                        <SelectItem value="10">Noviembre</SelectItem>
                        <SelectItem value="11">Diciembre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Quarter Selector (only for quarterly) */}
                {periodType === 'quarter' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Trimestre</label>
                    <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                      <SelectTrigger data-testid="select-quarter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Q1">Q1 (Ene-Mar)</SelectItem>
                        <SelectItem value="Q2">Q2 (Abr-Jun)</SelectItem>
                        <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                        <SelectItem value="Q4">Q4 (Oct-Dic)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Year Selector (not for "all" period) */}
                {periodType !== 'all' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Año</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger data-testid="select-year">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map(year => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Category Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo</label>
                  <Select value={categoryType} onValueChange={(value: 'all' | 'income' | 'expense') => {
                    setCategoryType(value);
                    setSelectedCategory('all');
                  }}>
                    <SelectTrigger data-testid="select-category-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="income">Ingresos</SelectItem>
                      <SelectItem value="expense">Gastos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categoryType === 'income' && incomeCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                      {categoryType === 'expense' && expenseCategories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                      {categoryType === 'all' && (
                        <>
                          {incomeCategories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name} (Ingreso)</SelectItem>
                          ))}
                          {expenseCategories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name} (Gasto)</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                    {getPeriodLabel()}
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
                    {getPeriodLabel()}
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
                    {getPeriodLabel()}
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
                    {getPeriodLabel()}
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
                <CardTitle>Tendencias - {getPeriodLabel()}</CardTitle>
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
              <CardTitle>Comparativa Ingresos vs Gastos - {getPeriodLabel()}</CardTitle>
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
              <CardTitle>Resumen Estadístico - {getPeriodLabel()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(monthlyData.reduce((sum: number, month: any) => sum + month.income, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Ingresos Totales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(monthlyData.reduce((sum: number, month: any) => sum + month.expenses, 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Gastos Totales</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">
                    {formatCurrency(monthlyData.reduce((sum: number, month: any) => sum + (month.income - month.expenses), 0))}
                  </p>
                  <p className="text-sm text-muted-foreground">Ganancia Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
