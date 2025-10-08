import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import TransactionModal from "@/components/forms/TransactionModal";
import { useTransactions } from "@/hooks/use-transactions";
import { useClients } from "@/hooks/use-clients";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import type { InsertTransaction } from "@shared/schema";

export default function Income() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const { currentCompanyId } = useCompany();
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  const { transactions, createTransaction } = useTransactions({
    type: 'income',
    search: '',
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const { clients } = useClients();

  const handleCreateTransaction = (transaction: InsertTransaction) => {
    if (!currentCompanyId) return;
    createTransaction.mutate({ ...transaction, type: 'income', companyId: currentCompanyId });
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

  if (!hasCompanySelected) {
    return (
      <div key="income-no-company" className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <NoCompanySelected />
        </div>
      </div>
    );
  }

  return (
    <div key={`income-${currentCompanyId}`} className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          key="income-topbar"
          title="Ingresos"
          subtitle="Gestión de ingresos por ventas"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenTransactionModal={canWrite ? () => setIsTransactionModalOpen(true) : undefined}
        />
        
        <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Historial de Ingresos</h3>
                  <p className="text-sm text-muted-foreground">
                    {transactions?.length || 0} transacciones registradas
                  </p>
                </div>
              </div>
              
              <div className="overflow-x-auto" data-testid="income-table">
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
                        Cantidad
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
                          No hay ingresos registrados. 
                          <button 
                            onClick={() => setIsTransactionModalOpen(true)}
                            className="text-primary hover:underline ml-1"
                          >
                            Crear el primero
                          </button>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction: any) => (
                        <tr 
                          key={transaction.id} 
                          className="transaction-row"
                          data-testid={`income-row-${transaction.id}`}
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
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">
                              {transaction.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm">
                            {transaction.quantity || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </main>

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSubmit={handleCreateTransaction}
        clients={clients?.map((c: any) => ({ id: c.id, name: c.name })) || []}
        suppliers={[]}
      />
    </div>
  );
}
