import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import TransactionModal from "@/components/forms/TransactionModal";
import PdfViewer from "@/components/shared/PdfViewer";
import { useTransactions } from "@/hooks/use-transactions";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCategories } from "@/hooks/use-categories";
import { useCompany } from "@/contexts/CompanyContext";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, FileText, Search, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { InsertTransaction, Transaction } from "@shared/schema";

export default function Expenses() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ data: string; fileName: string } | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const { currentCompanyId } = useCompany();
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  const { transactions, createTransaction, updateTransaction, deleteTransaction } = useTransactions({
    type: 'expense',
    search: searchTerm,
    category: selectedCategoryFilter === "all" ? '' : selectedCategoryFilter,
    dateFrom: dateFrom,
    dateTo: dateTo,
  });

  const { suppliers } = useSuppliers();
  const { categories: expenseCategories } = useCategories('expense');

  const handleCreateTransaction = (transaction: InsertTransaction) => {
    if (!currentCompanyId) return;
    if (editingTransaction) {
      updateTransaction.mutate(
        { id: editingTransaction.id, transaction: { ...transaction, type: 'expense', companyId: currentCompanyId } },
        {
          onSuccess: () => {
            setIsTransactionModalOpen(false);
            setEditingTransaction(null);
          },
        }
      );
    } else {
      createTransaction.mutate(
        { ...transaction, type: 'expense', companyId: currentCompanyId },
        {
          onSuccess: () => {
            setIsTransactionModalOpen(false);
          },
        }
      );
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteTransaction.mutate(id, {
      onSuccess: () => {
        setDeletingTransactionId(null);
      },
    });
  };

  const handleCloseModal = () => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryFilter("all");
    setDateFrom("");
    setDateTo("");
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
    <div key={`expenses-${location}-${currentCompanyId}`} className="flex h-screen overflow-hidden bg-background">
      <Sidebar key={`sidebar-${location}`} />
      <MobileMenu key={`mobile-${location}`} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
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

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por concepto o notas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-expenses"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategoryFilter}
                  onValueChange={setSelectedCategoryFilter}
                >
                  <SelectTrigger data-testid="select-filter-category-expenses">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {expenseCategories?.filter(cat => cat.isActive).map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date From */}
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="Fecha desde"
                  data-testid="input-date-from-expenses"
                />

                {/* Date To */}
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="Fecha hasta"
                  data-testid="input-date-to-expenses"
                />
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedCategoryFilter !== "all" || dateFrom || dateTo) && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters-expenses"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              )}
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
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!transactions || transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
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
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {transaction.pdfDocument && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewingPdf({ data: transaction.pdfDocument!, fileName: transaction.pdfFileName || 'documento.pdf' })}
                                  data-testid={`button-view-pdf-${transaction.id}`}
                                >
                                  <FileText className="h-4 w-4 text-blue-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(transaction)}
                                disabled={!canWrite}
                                data-testid={`button-edit-expense-${transaction.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingTransactionId(transaction.id)}
                                disabled={!canWrite}
                                data-testid={`button-delete-expense-${transaction.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateTransaction}
        clients={[]}
        suppliers={suppliers?.map((s: any) => ({ id: s.id, name: s.name })) || []}
        initialData={editingTransaction}
        mode={editingTransaction ? 'edit' : 'create'}
      />

      <AlertDialog open={!!deletingTransactionId} onOpenChange={() => setDeletingTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTransactionId && handleDelete(deletingTransactionId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewingPdf && (
        <PdfViewer
          isOpen={true}
          onClose={() => setViewingPdf(null)}
          pdfData={viewingPdf.data}
          fileName={viewingPdf.fileName}
        />
      )}
    </div>
  );
}
