import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import TransactionModal from "@/components/forms/TransactionModal";
import { useTransactions } from "@/hooks/use-transactions";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import type { InsertTransaction } from "@shared/schema";

export default function Expenses() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { currentCompanyId } = useCompany();
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  const { transactions, createTransaction, isLoading } = useTransactions({
    type: 'expense',
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const { suppliers } = useSuppliers();

  const handleCreateTransaction = (transaction: InsertTransaction) => {
    if (!currentCompanyId) return;
    createTransaction.mutate({ ...transaction, type: 'expense', companyId: currentCompanyId });
    setIsTransactionModalOpen(false);
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Semillas': 'primary',
      'Fertilizantes': 'destructive',
      'Mano de Obra': 'accent',
      'Maquinaria': 'muted',
      'Infraestructura': 'secondary',
      'Servicios': 'accent',
    };
    return colors[category] || 'muted';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {!hasCompanySelected ? (
        <div className="flex-1 flex items-center justify-center">
          <NoCompanySelected />
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando gastos...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Gastos"
            subtitle="Gestión de gastos operativos"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenTransactionModal={canWrite ? () => setIsTransactionModalOpen(true) : undefined}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Historial de Gastos</h3>
                <p className="text-sm text-muted-foreground">
                  {transactions?.length || 0} transacciones registradas
                </p>
              </div>
            </div>
            
            <div className="overflow-x-auto" data-testid="expenses-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Fecha
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Concepto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Proveedor
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Importe
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!transactions || transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No hay gastos registrados. 
                        <button 
                          onClick={() => setIsTransactionModalOpen(true)}
                          className="text-primary hover:underline ml-1"
                        >
                          Crear el primero
                        </button>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => {
                      const supplier = suppliers?.find((s: any) => s.id === transaction.clientSupplierId);
                      const categoryColor = getCategoryColor(transaction.category);
                      const colorMap: Record<string, { bg: string, text: string }> = {
                        primary: { bg: 'bg-primary/10', text: 'text-primary' },
                        destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
                        accent: { bg: 'bg-accent/10', text: 'text-accent' },
                        muted: { bg: 'bg-muted/10', text: 'text-muted-foreground' },
                        secondary: { bg: 'bg-secondary/10', text: 'text-secondary' }
                      };
                      const colors = colorMap[categoryColor] || colorMap.muted;
                      
                      return (
                        <tr 
                          key={transaction.id} 
                          className="transaction-row"
                          data-testid={`expense-row-${transaction.id}`}
                        >
                          <td className="py-3 px-4 text-sm">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium">{transaction.concept}</p>
                            {transaction.notes && (
                              <p className="text-xs text-muted-foreground">{transaction.notes}</p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span 
                              className={`inline-block px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} rounded`}
                            >
                              {transaction.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {supplier?.name || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-semibold text-destructive">
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </main>
      )}

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        clients={[]}
        suppliers={suppliers?.map((s: any) => ({ id: s.id, name: s.name })) || []}
      />
    </div>
  );
}
