import { useState } from "react";
import { Search, RotateCcw, Download, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction, TransactionFilter } from "@shared/schema";

interface SearchAndFilterProps {
  transactions: Transaction[];
  onFilterChange: (filter: TransactionFilter) => void;
}

export default function SearchAndFilter({ transactions, onFilterChange }: SearchAndFilterProps) {
  const [filter, setFilter] = useState<TransactionFilter>({
    search: '',
    type: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
  });

  const handleFilterChange = (key: keyof TransactionFilter, value: string) => {
    const newFilter = { ...filter, [key]: value };
    setFilter(newFilter);
    onFilterChange(newFilter);
  };

  const handleClearFilters = () => {
    const clearedFilter: TransactionFilter = {
      search: '',
      type: 'all',
      category: '',
      dateFrom: '',
      dateTo: '',
    };
    setFilter(clearedFilter);
    onFilterChange(clearedFilter);
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

  const getCategoryBadgeColor = (category: string) => {
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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Buscar Transacciones</h3>
        <p className="text-sm text-muted-foreground">Filtra y encuentra cualquier movimiento</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Buscar</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Concepto o monto..."
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
              data-testid="search-input"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tipo</label>
          <Select value={filter.type} onValueChange={(value) => handleFilterChange('type', value)}>
            <SelectTrigger data-testid="type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Ingresos</SelectItem>
              <SelectItem value="expense">Gastos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Categoría</label>
          <Select value={filter.category || 'all'} onValueChange={(value) => handleFilterChange('category', value)}>
            <SelectTrigger data-testid="category-select">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Ventas">Ventas</SelectItem>
              <SelectItem value="Semillas">Semillas</SelectItem>
              <SelectItem value="Fertilizantes">Fertilizantes</SelectItem>
              <SelectItem value="Mano de Obra">Mano de Obra</SelectItem>
              <SelectItem value="Maquinaria">Maquinaria</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Fecha</label>
          <Input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            data-testid="date-input"
          />
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <Button data-testid="button-search">
          <Search className="w-4 h-4 mr-2" />
          Buscar
        </Button>
        <Button 
          variant="outline"
          onClick={handleClearFilters}
          data-testid="button-clear-filters"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Limpiar filtros
        </Button>
        <Button 
          variant="outline"
          className="ml-auto"
          data-testid="button-export"
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      </div>
      
      <div className="overflow-x-auto" data-testid="transactions-table">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Fecha</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Concepto</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Categoría</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Monto</th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No se encontraron transacciones
                </td>
              </tr>
            ) : (
              transactions.slice(0, 10).map((transaction) => {
                const colorMap: Record<string, { bg: string, text: string }> = {
                  primary: { bg: 'bg-primary/10', text: 'text-primary' },
                  destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
                  accent: { bg: 'bg-accent/10', text: 'text-accent' },
                  muted: { bg: 'bg-muted/10', text: 'text-muted-foreground' }
                };
                const badgeColor = getCategoryBadgeColor(transaction.category);
                const colors = colorMap[badgeColor] || colorMap.muted;
                
                return (
                  <tr 
                    key={transaction.id} 
                    className="transaction-row"
                    data-testid={`transaction-row-${transaction.id}`}
                  >
                    <td className="py-3 px-4 text-sm">{formatDate(transaction.date)}</td>
                    <td className="py-3 px-4">
                      <p className="text-sm font-medium">{transaction.concept}</p>
                      {transaction.quantity && (
                        <p className="text-xs text-muted-foreground">{transaction.quantity}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className={`inline-block px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} rounded`}
                      >
                        {transaction.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'income' ? (
                          <>
                            <div className="w-2 h-2 bg-primary rounded-full" />
                            <span className="text-sm">Ingreso</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-destructive rounded-full" />
                            <span className="text-sm">Gasto</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span 
                        className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-primary' : 'text-destructive'}`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`view-transaction-${transaction.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`edit-transaction-${transaction.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          data-testid={`delete-transaction-${transaction.id}`}
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
      
      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
        <p className="text-sm text-muted-foreground">
          Mostrando <span className="font-medium">1-{Math.min(10, transactions.length)}</span> de <span className="font-medium">{transactions.length}</span> transacciones
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            Anterior
          </Button>
          <Button size="sm">1</Button>
          <Button variant="outline" size="sm">2</Button>
          <Button variant="outline" size="sm">3</Button>
          <Button variant="outline" size="sm">
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
