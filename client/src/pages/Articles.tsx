import { useState } from "react";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useArticles } from "@/hooks/use-articles";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { insertArticleSchema, type InsertArticle } from "@shared/schema";
import { z } from "zod";

const VAT_RATES = [
  { value: "21.00", label: "21% (General)" },
  { value: "10.00", label: "10% (Reducido)" },
  { value: "4.00", label: "4% (Superreducido)" },
  { value: "0.00", label: "0% (Exento)" },
];

const UNITS = [
  { value: "unidad", label: "Unidad" },
  { value: "kg", label: "Kilogramo" },
  { value: "litro", label: "Litro" },
  { value: "metro", label: "Metro" },
  { value: "hora", label: "Hora" },
  { value: "servicio", label: "Servicio" },
];

const formSchema = insertArticleSchema.extend({
  code: z.string().min(1, "El código es obligatorio"),
  name: z.string().min(1, "El nombre es obligatorio"),
  unitPrice: z.union([z.string(), z.number()]).refine(val => {
    const num = parseFloat(String(val));
    return !isNaN(num) && num >= 0;
  }, "El precio debe ser un número válido"),
});

export default function Articles() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { articles, createArticle, updateArticle, deleteArticle, isLoading } = useArticles();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();

  const form = useForm<InsertArticle>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      unitPrice: '0',
      vatRate: '21.00',
      unitOfMeasure: 'unidad',
      isActive: true,
    },
  });

  const handleSubmit = (data: InsertArticle) => {
    if (editingArticle) {
      updateArticle.mutate({ id: editingArticle, article: { ...data, companyId: currentCompanyId ?? undefined } });
    } else {
      createArticle.mutate({ ...data, companyId: currentCompanyId ?? undefined });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingArticle(null);
    form.reset();
  };

  const handleEdit = (articleId: string) => {
    const article = articles?.find(a => a.id === articleId);
    if (article) {
      setEditingArticle(articleId);
      form.reset({
        code: article.code,
        name: article.name,
        description: article.description || '',
        unitPrice: article.unitPrice,
        vatRate: article.vatRate,
        unitOfMeasure: article.unitOfMeasure || 'unidad',
        isActive: article.isActive,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (articleId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este artículo?')) {
      deleteArticle.mutate(articleId);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const filteredArticles = articles?.filter(article => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      article.name.toLowerCase().includes(search) ||
      article.code.toLowerCase().includes(search) ||
      (article.description && article.description.toLowerCase().includes(search))
    );
  });

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
            <p className="text-muted-foreground">Cargando artículos...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Artículos"
            subtitle="Gestión de productos y servicios para facturación"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Lista de Artículos</h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredArticles?.length || 0} artículos
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="Buscar artículos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                    data-testid="input-search-articles"
                  />
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    data-testid="button-add-article"
                    disabled={!canWrite}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Artículo
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto" data-testid="articles-table">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Código
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Artículo
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Precio
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        IVA
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Unidad
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
                    {!filteredArticles || filteredArticles.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p>No hay artículos registrados.</p>
                          {canWrite && (
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="text-primary hover:underline mt-2"
                            >
                              Agregar el primero
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredArticles.map((article) => (
                        <tr 
                          key={article.id} 
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                          data-testid={`article-row-${article.id}`}
                        >
                          <td className="py-3 px-4">
                            <span className="text-sm font-mono text-muted-foreground">
                              {article.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium">{article.name}</p>
                              {article.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-xs">
                                  {article.description}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-semibold text-primary">
                              {formatCurrency(article.unitPrice)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm">
                              {article.vatRate}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-sm capitalize">
                              {article.unitOfMeasure}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span 
                              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                article.isActive 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {article.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEdit(article.id)}
                                disabled={!canWrite}
                                data-testid={`edit-article-${article.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDelete(article.id)}
                                disabled={!canWrite}
                                data-testid={`delete-article-${article.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingArticle ? 'Editar Artículo' : 'Nuevo Artículo'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  {...form.register('code')}
                  placeholder="ART001"
                  data-testid="input-article-code"
                />
                {form.formState.errors.code && (
                  <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unidad</Label>
                <Select 
                  value={form.watch('unitOfMeasure') || 'unidad'}
                  onValueChange={(value) => form.setValue('unitOfMeasure', value)}
                >
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Nombre del artículo"
                data-testid="input-article-name"
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Descripción opcional"
                data-testid="input-article-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Precio (sin IVA) *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...form.register('unitPrice')}
                  placeholder="0.00"
                  data-testid="input-article-price"
                />
                {form.formState.errors.unitPrice && (
                  <p className="text-xs text-destructive">{form.formState.errors.unitPrice.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate">Tipo de IVA</Label>
                <Select 
                  value={form.watch('vatRate') || '21.00'}
                  onValueChange={(value) => form.setValue('vatRate', value)}
                >
                  <SelectTrigger data-testid="select-vat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VAT_RATES.map(rate => (
                      <SelectItem key={rate.value} value={rate.value}>
                        {rate.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                {...form.register('isActive')}
                className="rounded border-border"
                data-testid="checkbox-article-active"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Artículo activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createArticle.isPending || updateArticle.isPending}
                data-testid="button-save-article"
              >
                {createArticle.isPending || updateArticle.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
