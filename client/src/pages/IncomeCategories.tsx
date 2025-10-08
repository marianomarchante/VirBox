import { useState } from "react";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useCategories } from "@/hooks/use-categories";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { insertCategorySchema, type InsertCategory } from "@shared/schema";
import { z } from "zod";

const categoryFormSchema = insertCategorySchema.extend({
  type: z.literal('income'),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function IncomeCategories() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  const { categories, createCategory, updateCategory, deleteCategory, isLoading } = useCategories('income');
  const { canWrite, hasCompanySelected } = useCompanyPermission();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      type: 'income',
      isActive: true,
    },
  });

  const handleSubmit = (data: CategoryFormValues) => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory, category: data });
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
      type: 'income',
      isActive: true,
    });
  };

  const handleEdit = (categoryId: string) => {
    const category = categories?.find(c => c.id === categoryId);
    if (category) {
      setEditingCategory(categoryId);
      form.reset({
        name: category.name,
        type: 'income',
        isActive: category.isActive,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (categoryId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta categoría?')) {
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
            <p className="text-muted-foreground">Cargando categorías de ingresos...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Categorías de Ingresos"
            subtitle="Gestión de categorías para ingresos"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Categorías de Ingresos</h3>
                <p className="text-sm text-muted-foreground">
                  {categories?.length || 0} categorías registradas
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                data-testid="button-add-category"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Categoría
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="categories-list">
              {categories?.map((category) => (
                <div
                  key={category.id}
                  className="bg-muted/50 rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
                  data-testid={`category-card-${category.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground" data-testid={`category-name-${category.id}`}>
                          {category.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {category.isActive ? 'Activa' : 'Inactiva'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(category.id)}
                      data-testid={`button-edit-${category.id}`}
                      disabled={!canWrite}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(category.id)}
                      data-testid={`button-delete-${category.id}`}
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
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría de Ingreso'}
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
                        placeholder="Ej: Ventas de productos"
                        data-testid="input-category-name"
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
                        data-testid="switch-category-active"
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
                  data-testid="button-cancel"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createCategory.isPending || updateCategory.isPending}
                  data-testid="button-save-category"
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
