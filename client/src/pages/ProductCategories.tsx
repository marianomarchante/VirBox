import { useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { 
  useProductCategories, 
  useCreateProductCategory, 
  useUpdateProductCategory, 
  useDeleteProductCategory 
} from "@/hooks/use-product-categories";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { insertProductCategorySchema, type InsertProductCategory } from "@shared/schema";

type CategoryFormValues = InsertProductCategory;

export default function ProductCategories() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const { data: categories, isLoading } = useProductCategories();
  const createCategory = useCreateProductCategory();
  const updateCategory = useUpdateProductCategory();
  const deleteCategory = useDeleteProductCategory();
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(insertProductCategorySchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  const handleSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory, data });
    } else {
      createCategory.mutate(data);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.reset({
      name: '',
      description: '',
      isActive: true,
    });
  };

  const handleEdit = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      form.reset({
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta categoría de bienes de la entidad?')) {
      deleteCategory.mutate(categoryId);
    }
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
            <p className="text-muted-foreground">Cargando categorías de bienes de la entidad...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Categorías de Bienes de la entidad"
            subtitle="Gestión de categorías para el inventario"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Categorías de Bienes de la entidad</h3>
                <p className="text-sm text-muted-foreground">
                  {categories?.length || 0} categorías registradas
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                data-testid="button-add-product-category"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Categoría
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="product-categories-list">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
                  data-testid={`product-category-card-${category.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground" data-testid={`product-category-name-${category.id}`}>
                          {category.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(category.id)}
                      data-testid={`button-edit-product-category-${category.id}`}
                      disabled={!canWrite}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(category.id)}
                      data-testid={`button-delete-product-category-${category.id}`}
                      disabled={!canWrite}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        </main>
      )}

      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoría de Producto' : 'Nueva Categoría de Producto'}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Categoría</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Ej: Electrónica, Muebles, Ropa"
                        data-testid="input-product-category-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        value={field.value || ''}
                        placeholder="Descripción de la categoría"
                        data-testid="input-product-category-description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {field.value ? 'Categoría activa' : 'Categoría inactiva'}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-product-category-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCloseModal}
                  data-testid="button-cancel-product-category"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                  data-testid="button-save-product-category"
                >
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
