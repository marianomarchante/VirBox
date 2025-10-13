import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useProductCategories } from "@/hooks/use-product-categories";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertInventorySchema, type InsertInventory } from "@shared/schema";

export default function Inventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  
  const { inventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  const { data: productCategories } = useProductCategories();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();

  // Filtered inventory based on search and category filters
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    return inventory.filter(item => {
      // Search filter (by product name) - trim to avoid accidental spaces
      const trimmedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = trimmedSearch === "" || 
        (item.name?.toLowerCase() ?? "").includes(trimmedSearch);

      // Category filter
      const matchesCategory = selectedCategoryFilter === "all" || 
        (selectedCategoryFilter === "none" && !item.categoryId) ||
        item.categoryId === selectedCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchTerm, selectedCategoryFilter]);

  const form = useForm<InsertInventory>({
    resolver: zodResolver(insertInventorySchema),
    defaultValues: {
      name: "",
      categoryId: null,
      currentStock: "0",
      unit: "kg",
      minStock: "0",
      pricePerUnit: "0",
    },
  });

  const onSubmit = async (data: InsertInventory) => {
    try {
      if (editingItemId) {
        await updateInventoryItem.mutateAsync({ id: editingItemId, item: { ...data, companyId: currentCompanyId ?? undefined } });
      } else {
        await createInventoryItem.mutateAsync({ ...data, companyId: currentCompanyId ?? undefined });
      }
      handleCloseModal();
    } catch (error) {
      // Error is handled by the mutation's onError callback
      // Keep modal open to allow user to fix the issue
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItemId(null);
    form.reset({
      name: "",
      categoryId: null,
      currentStock: "0",
      unit: "kg",
      minStock: "0",
      pricePerUnit: "0",
    });
  };

  const handleModalOpenChange = (open: boolean) => {
    if (open) {
      setIsModalOpen(true);
    } else {
      handleCloseModal();
    }
  };

  const handleEdit = (item: any) => {
    setEditingItemId(item.id);
    form.reset({
      name: item.name,
      categoryId: item.categoryId,
      currentStock: item.currentStock,
      unit: item.unit,
      minStock: item.minStock || "",
      pricePerUnit: item.pricePerUnit || "",
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      try {
        await deleteInventoryItem.mutateAsync(itemToDelete);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      } catch (error) {
        // Error is handled by the mutation's onError callback
        setDeleteDialogOpen(false);
        setItemToDelete(null);
      }
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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId || !productCategories) return 'Sin categoría';
    const category = productCategories.find(c => c.id === categoryId);
    return category?.name || 'Sin categoría';
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryFilter("all");
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
        
        {!hasCompanySelected ? (
          <NoCompanySelected />
        ) : (
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Inventario de bienes de la entidad</h3>
                <p className="text-sm text-muted-foreground">
                  {filteredInventory?.length || 0} de {inventory?.length || 0} productos
                </p>
              </div>
              <Button 
                data-testid="button-add-product"
                onClick={() => setIsModalOpen(true)}
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre de producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-inventory"
                  />
                </div>

                {/* Category Filter */}
                <Select
                  value={selectedCategoryFilter}
                  onValueChange={setSelectedCategoryFilter}
                >
                  <SelectTrigger data-testid="select-filter-category-inventory">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {productCategories?.filter(cat => cat.isActive).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters Button */}
              {(searchTerm || selectedCategoryFilter !== "all") && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters-inventory"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                </div>
              )}
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
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!filteredInventory || filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        {searchTerm || selectedCategoryFilter !== "all"
                          ? "No se encontraron productos con los filtros aplicados"
                          : "No hay productos en inventario."}
                        {!searchTerm && selectedCategoryFilter === "all" && canWrite && (
                          <button 
                            className="text-primary hover:underline ml-1"
                            onClick={() => setIsModalOpen(true)}
                            data-testid="link-add-first-product"
                          >
                            Agregar el primero
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item: any) => {
                      const status = getStockStatus(item.currentStock, item.minStock || '0');
                      return (
                        <tr 
                          key={item.id} 
                          className="transaction-row"
                          data-testid={`inventory-row-${item.id}`}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Actualizado: {new Date(item.lastUpdated).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                              {getCategoryName(item.categoryId)}
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
                                  currency: 'EUR' 
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
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(item)}
                                disabled={!canWrite}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(item.id)}
                                disabled={!canWrite}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
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
        )}
      </main>

      <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItemId ? 'Editar Producto' : 'Agregar Producto al Inventario'}
            </DialogTitle>
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
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)} 
                      defaultValue={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none" data-testid="option-category-none">Sin categoría</SelectItem>
                        {productCategories?.filter(c => c.isActive).map((category) => (
                          <SelectItem 
                            key={category.id} 
                            value={category.id}
                            data-testid={`option-category-${category.id}`}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
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
                  onClick={handleCloseModal}
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createInventoryItem.isPending || updateInventoryItem.isPending}
                  data-testid="button-save-product"
                >
                  {(createInventoryItem.isPending || updateInventoryItem.isPending) ? "Guardando..." : editingItemId ? "Actualizar" : "Guardar Producto"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente este producto del inventario. Esta operación no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
