import { Package2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Inventory } from "@shared/schema";

interface InventoryStatusProps {
  inventory: Inventory[];
}

export default function InventoryStatus({ inventory }: InventoryStatusProps) {
  const getStockStatus = (current: string, min: string) => {
    const currentStock = parseFloat(current);
    const minStock = parseFloat(min || '0');
    
    if (currentStock <= minStock) {
      return { label: 'Stock Bajo', color: 'accent' };
    }
    return { label: 'En Stock', color: 'primary' };
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'vegetables': '🥬',
      'grains': '🌾',
      'fruits': '🍎',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Estado de Inventario</h3>
          <p className="text-sm text-muted-foreground">Productos en stock</p>
        </div>
        <Button size="sm" data-testid="button-add-inventory">
          <Plus className="w-4 h-4 mr-2" />
          Entrada
        </Button>
      </div>
      
      <div className="overflow-x-auto" data-testid="inventory-table">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">
                Producto
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">
                Stock
              </th>
              <th className="text-right py-3 px-2 text-xs font-semibold text-muted-foreground uppercase">
                Estado
              </th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  No hay productos en inventario
                </td>
              </tr>
            ) : (
              inventory.slice(0, 5).map((item) => {
                const status = getStockStatus(item.currentStock, item.minStock || '0');
                const colorMap: Record<string, { bg: string, text: string }> = {
                  primary: { bg: 'bg-primary/10', text: 'text-primary' },
                  accent: { bg: 'bg-accent/10', text: 'text-accent' }
                };
                const colors = colorMap[status.color] || colorMap.primary;
                
                return (
                  <tr 
                    key={item.id} 
                    className="transaction-row"
                    data-testid={`inventory-item-${item.id}`}
                  >
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="text-sm">
                        {parseFloat(item.currentStock).toLocaleString('es-ES')} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span 
                        className={`inline-block px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} rounded`}
                      >
                        {status.label}
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
  );
}
