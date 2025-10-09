import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";
import IncomeVsExpensesChart from "@/components/dashboard/IncomeVsExpensesChart";
import CategoryBreakdown from "@/components/dashboard/CategoryBreakdown";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import InventoryStatus from "@/components/dashboard/InventoryStatus";
import TopClients from "@/components/dashboard/TopClients";
import SearchAndFilter from "@/components/dashboard/SearchAndFilter";
import TransactionModal from "@/components/forms/TransactionModal";
import { useTransactions } from "@/hooks/use-transactions";
import { useInventory } from "@/hooks/use-inventory";
import { useClients } from "@/hooks/use-clients";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import type { TransactionFilter, InsertTransaction } from "@shared/schema";

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>({
    search: '',
    type: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const { currentCompanyId } = useCompany();
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  // Data fetching
  const { data: metrics } = useQuery({
    queryKey: ['/api/dashboard/metrics', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/dashboard/metrics?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const { data: monthlyData = [] } = useQuery({
    queryKey: ['/api/dashboard/monthly-data', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/dashboard/monthly-data?${params.toString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const { 
    transactions, 
    createTransaction, 
    filteredTransactions 
  } = useTransactions(transactionFilter);

  const { inventory } = useInventory();
  const { clients } = useClients();
  const { suppliers } = useSuppliers();

  // Event handlers
  const handleCreateTransaction = (transaction: InsertTransaction) => {
    if (!currentCompanyId) return;
    createTransaction.mutate({ ...transaction, companyId: currentCompanyId });
    setIsTransactionModalOpen(false);
  };

  const incomeTransactions = transactions?.filter((t: any) => t.type === 'income') || [];
  const expenseTransactions = transactions?.filter((t: any) => t.type === 'expense') || [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Dashboard"
          subtitle="Resumen financiero del mes"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenTransactionModal={canWrite ? () => setIsTransactionModalOpen(true) : undefined}
        />
        
        {!hasCompanySelected ? (
          <NoCompanySelected />
        ) : !metrics ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 lg:p-8 space-y-6">
            <MetricsGrid metrics={metrics as { totalIncome: number; totalExpenses: number; balance: number }} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <IncomeVsExpensesChart data={monthlyData as any} />
              <CategoryBreakdown />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentTransactions 
                transactions={incomeTransactions} 
                title="Ingresos Recientes" 
                type="income" 
              />
              <RecentTransactions 
                transactions={expenseTransactions} 
                title="Gastos Recientes" 
                type="expense" 
              />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InventoryStatus inventory={inventory || []} />
              <TopClients clients={clients || []} />
            </div>
            
            <SearchAndFilter 
              transactions={filteredTransactions || []}
              onFilterChange={setTransactionFilter}
            />
          </div>
        )}
      </main>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        clients={clients?.map((c: any) => ({ id: c.id, name: c.name })) || []}
        suppliers={suppliers?.map((s: any) => ({ id: s.id, name: s.name })) || []}
      />
    </div>
  );
}
