import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useInventory } from "@/hooks/use-inventory";

export default function Inventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { inventory } = useInventory();

  const formatStock = (stock: string, unit: string) => {
    const num = parseFloat(stock);
    return `${num.toLocaleString('es-ES')} ${unit}`;
  };

  const getStockStatus = (current: string, min: string) => {
    const currentStock = parseFloat(current);
    const minStock = parseFloat(min || '0');
    
    if (currentStock <= minStock) {
      return { label: 'Stock Bajo', color: 'bg-accent/10 text-accent' };
    } else if (currentStock <= minStock * 1.5) {
      return { label: 'Stock Medio', color: 'bg-secondary/10 text-secondary' };
    }
    return { label: 'En Stock', color: 'bg-primary/10 text-primary' };
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'vegetables': '🥬',
      'grains': '🌾',
      'fruits': '🍎',
      'seeds': '🌱',
      'equipment': '🚜',
    };
    return icons[category] || '📦';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Inventario"
          subtitle="Control de productos y materiales"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        
        <div className="p-4 lg:p-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Inventario de Productos</h3>
                <p className="text-sm text-muted-foreground">
                  {inventory?.length || 0} productos registrados
                </p>
              </div>
              <Button data-testid="button-add-product">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </div>
            
            <div className="overflow-x-auto" data-testid="inventory-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Producto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Categoría
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Stock Actual
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Stock Mínimo
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Precio/Unidad
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!inventory || inventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No hay productos en inventario. 
                        <button className="text-primary hover:underline ml-1">
                          Agregar el primero
                        </button>
                      </td>
                    </tr>
                  ) : (
                    inventory.map((item: any) => {
                      const status = getStockStatus(item.currentStock, item.minStock || '0');
                      return (
                        <tr 
                          key={item.id} 
                          className="transaction-row"
                          data-testid={`inventory-row-${item.id}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{getCategoryIcon(item.category)}</span>
                              <div>
                                <p className="text-sm font-medium">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Actualizado: {new Date(item.lastUpdated).toLocaleDateString('es-ES')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded capitalize">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium">
                              {formatStock(item.currentStock, item.unit)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm text-muted-foreground">
                              {item.minStock ? formatStock(item.minStock, item.unit) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm text-muted-foreground">
                              {item.pricePerUnit ? 
                                new Intl.NumberFormat('es-ES', { 
                                  style: 'currency', 
                                  currency: 'USD' 
                                }).format(parseFloat(item.pricePerUnit))
                                : '-'
                              }
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${status.color}`}>
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
        </div>
      </main>
    </div>
  );
}
