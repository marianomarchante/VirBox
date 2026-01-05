import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, Search, X, Upload, FileText, Image, Camera } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import PdfViewer from "@/components/shared/PdfViewer";

// Form type for inventory
type InventoryFormData = InsertInventory;

export default function Inventory() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<{ name: string; data: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ name: string; data: string } | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  
  const { inventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  const { data: productCategories } = useProductCategories();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();
  const { toast } = useToast();

  // Filtered inventory based on search and category filters
  const filteredInventory = useMemo(() => {
    if (!inventory) return [];

    return inventory.filter(item => {
      // Search filter (by object name) - trim to avoid accidental spaces
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

  // Form validation schema
  const formSchema = insertInventorySchema;

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      categoryId: null,
      location: "",
      value: "0",
      idContenedor: "",
      pdfDocument: "",
      pdfFileName: "",
      imageDocument: "",
      imageFileName: "",
    },
  });

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedPdf({ name: file.name, data: base64 });
        form.setValue('pdfDocument', base64);
        form.setValue('pdfFileName', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePdf = () => {
    setSelectedPdf(null);
    form.setValue('pdfDocument', '');
    form.setValue('pdfFileName', '');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos de imagen.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedImage({ name: file.name, data: base64 });
        form.setValue('imageDocument', base64);
        form.setValue('imageFileName', file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    form.setValue('imageDocument', '');
    form.setValue('imageFileName', '');
  };

  const onSubmit = async (data: InventoryFormData) => {
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
    setSelectedPdf(null);
    setSelectedImage(null);
    form.reset({
      name: "",
      categoryId: null,
      location: "",
      value: "0",
      idContenedor: "",
      pdfDocument: "",
      pdfFileName: "",
      imageDocument: "",
      imageFileName: "",
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
      location: item.location || "",
      value: item.value,
      idContenedor: item.idContenedor || "",
      pdfDocument: item.pdfDocument || "",
      pdfFileName: item.pdfFileName || "",
      imageDocument: item.imageDocument || "",
      imageFileName: item.imageFileName || "",
    });
    if (item.pdfFileName) {
      setSelectedPdf({ name: item.pdfFileName, data: item.pdfDocument });
    }
    if (item.imageFileName) {
      setSelectedImage({ name: item.imageFileName, data: item.imageDocument });
    }
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
          subtitle="Control de objetos y bienes"
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
                  {filteredInventory?.length || 0} de {inventory?.length || 0} objetos
                </p>
              </div>
              <Button 
                data-testid="button-add-product"
                onClick={() => setIsModalOpen(true)}
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Objeto
              </Button>
            </div>

            {/* Filters Section */}
            <div className="mb-6 p-4 bg-muted/50 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre de objeto..."
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
                      Objeto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Emplazamiento
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      ID Contenedor
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Documento
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
                          ? "No se encontraron objetos con los filtros aplicados"
                          : "No hay objetos en inventario."}
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
                      return (
                        <tr 
                          key={item.id} 
                          className="transaction-row"
                          data-testid={`inventory-row-${item.id}`}
                        >
                          <td className="py-3 px-4">
                            <p className="text-sm font-medium">{item.name}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                              {getCategoryName(item.categoryId)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {item.location || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium">
                              {new Intl.NumberFormat('es-ES', { 
                                style: 'currency', 
                                currency: 'EUR' 
                              }).format(parseFloat(item.value || '0'))}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-muted-foreground">
                              {item.idContenedor || '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {item.pdfDocument && (
                                <button
                                  onClick={() => {
                                    setSelectedPdf({ 
                                      name: item.pdfFileName || 'documento.pdf', 
                                      data: item.pdfDocument 
                                    });
                                  }}
                                  className="text-blue-500 hover:text-blue-700"
                                  title="Ver documento PDF"
                                  data-testid={`button-view-pdf-${item.id}`}
                                >
                                  <FileText className="w-5 h-5" />
                                </button>
                              )}
                              {item.imageDocument && (
                                <button
                                  onClick={() => {
                                    setSelectedImage({ 
                                      name: item.imageFileName || 'imagen', 
                                      data: item.imageDocument 
                                    });
                                    setImageViewerOpen(true);
                                  }}
                                  className="text-green-500 hover:text-green-700"
                                  title="Ver imagen"
                                  data-testid={`button-view-image-${item.id}`}
                                >
                                  <Image className="w-5 h-5" />
                                </button>
                              )}
                            </div>
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItemId ? 'Editar Objeto' : 'Agregar Objeto al Inventario'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Objeto</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: Escritorio, Silla, Ordenador"
                        data-testid="input-object-name"
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

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emplazamiento (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Ej: Oficina principal, Almacén 2, Sala de juntas"
                        data-testid="input-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (€)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idContenedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Contenedor (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Ej: CONT-001"
                          data-testid="input-id-contenedor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="pdfDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento PDF (opcional)</FormLabel>
                    <FormControl>
                      <div className="mt-2">
                        {!selectedPdf ? (
                          <div className="flex items-center gap-3">
                            <Input
                              id="pdf"
                              type="file"
                              accept=".pdf,application/pdf"
                              onChange={handlePdfChange}
                              className="hidden"
                              data-testid="input-pdf-file"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => document.getElementById('pdf')?.click()}
                              className="w-full"
                              data-testid="button-upload-pdf"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Seleccionar archivo PDF
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 bg-muted rounded-md" data-testid="pdf-preview">
                            <FileText className="w-5 h-5 text-primary" />
                            <span className="flex-1 text-sm truncate" data-testid="text-pdf-name">
                              {selectedPdf.name}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemovePdf}
                              data-testid="button-remove-pdf"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imagen (opcional)</FormLabel>
                    <FormControl>
                      <div className="mt-2">
                        {!selectedImage ? (
                          <div className="space-y-2">
                            <Input
                              id="image-gallery"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                              data-testid="input-image-file"
                            />
                            <Input
                              id="image-camera"
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={handleImageChange}
                              className="hidden"
                              data-testid="input-camera-file"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('image-gallery')?.click()}
                                className="w-full"
                                data-testid="button-upload-image"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Galería
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('image-camera')?.click()}
                                className="w-full"
                                data-testid="button-take-photo"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Cámara
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              Selecciona desde galería o toma una foto
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-md" data-testid="image-preview">
                              <Image className="w-5 h-5 text-primary" />
                              <span className="flex-1 text-sm truncate" data-testid="text-image-name">
                                {selectedImage.name}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRemoveImage}
                                data-testid="button-remove-image"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            {selectedImage.data && (
                              <img 
                                src={selectedImage.data} 
                                alt="Vista previa" 
                                className="w-full max-h-32 object-contain rounded-md border border-border"
                                data-testid="image-thumbnail"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  data-testid="button-save-object"
                >
                  {(createInventoryItem.isPending || updateInventoryItem.isPending) ? "Guardando..." : editingItemId ? "Actualizar" : "Guardar Objeto"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar objeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente este objeto del inventario. Esta operación no se puede deshacer.
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

      {selectedPdf && (
        <PdfViewer
          isOpen={!!selectedPdf}
          onClose={() => setSelectedPdf(null)}
          pdfData={selectedPdf.data}
          fileName={selectedPdf.name}
        />
      )}

      {selectedImage && (
        <Dialog open={imageViewerOpen} onOpenChange={setImageViewerOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedImage.name}</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <img 
                src={selectedImage.data} 
                alt={selectedImage.name} 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                data-testid="image-viewer"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
