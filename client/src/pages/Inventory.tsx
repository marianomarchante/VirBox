import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useInventory } from "@/hooks/use-inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema, type InsertInventory } from "@shared/schema";

export default function Inventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { inventory, createInventoryItem } = useInventory();

  const form = useForm<InsertInventory>({
    resolver: zodResolver(insertInventorySchema),
    defaultValues: {
      name: "",
      category: "materials",
      currentStock: "0",
      unit: "kg",
      minStock: "0",
      pricePerUnit: "0",
    },
  });

  const onSubmit = async (data: InsertInventory) => {
    try {
      await createInventoryItem.mutateAsync(data);
      setIsAddModalOpen(false);
      form.reset();
    } catch (error) {
      // Error is handled by the mutation's onError callback
      // Keep modal open to allow user to fix the issue
    }
  };

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
      'materials': '🧱',
      'supplies': '📦',
      'equipment': '🔧',
      'products': '📦',
      'tools': '🛠️',
      'services': '⚙️',
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
              <Button 
                data-testid="button-add-product"
                onClick={() => setIsAddModalOpen(true)}
              >
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
                        <button 
                          className="text-primary hover:underline ml-1"
                          onClick={() => setIsAddModalOpen(true)}
                          data-testid="link-add-first-product"
                        >
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

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Producto al Inventario</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Producto</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Cemento, Arena, Ladrillos"
                        data-testid="input-product-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="materials" data-testid="option-category-materials">Materiales</SelectItem>
                        <SelectItem value="supplies" data-testid="option-category-supplies">Suministros</SelectItem>
                        <SelectItem value="equipment" data-testid="option-category-equipment">Equipo</SelectItem>
                        <SelectItem value="products" data-testid="option-category-products">Productos</SelectItem>
                        <SelectItem value="tools" data-testid="option-category-tools">Herramientas</SelectItem>
                        <SelectItem value="services" data-testid="option-category-services">Servicios</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actual</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0"
                          data-testid="input-current-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg" data-testid="option-unit-kg">Kilogramos (kg)</SelectItem>
                          <SelectItem value="units" data-testid="option-unit-units">Unidades</SelectItem>
                          <SelectItem value="tons" data-testid="option-unit-tons">Toneladas (t)</SelectItem>
                          <SelectItem value="m" data-testid="option-unit-m">Metros (m)</SelectItem>
                          <SelectItem value="m2" data-testid="option-unit-m2">Metros cuadrados (m²)</SelectItem>
                          <SelectItem value="m3" data-testid="option-unit-m3">Metros cúbicos (m³)</SelectItem>
                          <SelectItem value="l" data-testid="option-unit-l">Litros (l)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="number"
                          step="0.01"
                          placeholder="0"
                          data-testid="input-min-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pricePerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio por Unidad</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-price-per-unit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createInventoryItem.isPending}
                  data-testid="button-save-product"
                >
                  {createInventoryItem.isPending ? "Guardando..." : "Guardar Producto"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
