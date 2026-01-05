import { useState, useMemo } from "react";
import { Search, X, ImageOff, MapPin, Box, Plus, Upload, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { type Inventory, insertInventorySchema, type InsertInventory } from "@shared/schema";
import { useProductCategories } from "@/hooks/use-product-categories";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ObjectsGalleryProps {
  trigger: React.ReactNode;
}

interface ObjectDetailModalProps {
  item: Inventory | null;
  isOpen: boolean;
  onClose: () => void;
}

function ObjectDetailModal({ item, isOpen, onClose }: ObjectDetailModalProps) {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[600px] max-h-[95vh] overflow-y-auto p-0">
        <div className="relative">
          {item.imageDocument ? (
            <img
              src={item.imageDocument}
              alt={item.name}
              className="w-full h-[50vh] object-contain bg-muted"
              data-testid={`detail-image-${item.id}`}
            />
          ) : (
            <div className="w-full h-[50vh] bg-muted flex items-center justify-center">
              <ImageOff className="w-16 h-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-2xl" data-testid={`detail-name-${item.id}`}>
              {item.name}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Detalles del objeto {item.name}
            </DialogDescription>
          </DialogHeader>
          
          {item.idContenedor && (
            <div className="flex items-center gap-2 text-foreground">
              <Box className="w-5 h-5 text-primary" />
              <span className="text-lg font-medium" data-testid={`detail-id-contenedor-${item.id}`}>
                {item.idContenedor}
              </span>
            </div>
          )}

          {item.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-5 h-5 text-primary" />
              <span className="text-lg" data-testid={`detail-location-${item.id}`}>
                {item.location}
              </span>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline" data-testid="close-detail-modal">
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type InventoryFormData = InsertInventory;

export function ObjectsGallery({ trigger }: ObjectsGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ name: string; data: string } | null>(null);
  const { currentCompanyId } = useCompany();
  const { data: productCategories } = useProductCategories();
  const { toast } = useToast();

  const { data: inventoryItems = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory", { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append("companyId", currentCompanyId);
      const res = await fetch(`/api/inventory?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId && isOpen,
  });

  const form = useForm<InventoryFormData>({
    resolver: zodResolver(insertInventorySchema),
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

  const createMutation = useMutation({
    mutationFn: async (data: InsertInventory) => {
      const res = await apiRequest("POST", "/api/inventory", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({ title: "Objeto creado", description: "El objeto se ha añadido al inventario." });
      handleCloseForm();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = async (data: InventoryFormData) => {
    await createMutation.mutateAsync({ ...data, companyId: currentCompanyId ?? undefined });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Solo se permiten archivos de imagen.", variant: "destructive" });
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

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return inventoryItems;
    const lowerSearch = searchTerm.toLowerCase();
    return inventoryItems.filter((item) =>
      item.name.toLowerCase().includes(lowerSearch)
    );
  }, [inventoryItems, searchTerm]);

  const handleItemClick = (item: Inventory) => {
    if (item.imageDocument) {
      setSelectedItem(item);
      setIsDetailOpen(true);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedItem(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchTerm("");
      setIsFormOpen(false);
      handleCloseForm();
    }
  };

  const handleAddObject = () => {
    setIsFormOpen(true);
  };

  const handleBackToGallery = () => {
    handleCloseForm();
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[900px] max-h-[95vh] overflow-hidden flex flex-col">
          {isFormOpen ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">Agregar Objeto al Inventario</DialogTitle>
                <DialogDescription>
                  Complete los datos del nuevo objeto
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto mt-4">
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
                              data-testid="input-gallery-object-name"
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
                              <SelectTrigger data-testid="select-gallery-category">
                                <SelectValue placeholder="Seleccionar categoría" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin categoría</SelectItem>
                              {productCategories?.filter(c => c.isActive).map((category) => (
                                <SelectItem key={category.id} value={category.id}>
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
                              placeholder="Ej: Oficina principal, Almacén 2"
                              data-testid="input-gallery-location"
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
                                min="0"
                                placeholder="0.00"
                                data-testid="input-gallery-value"
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
                                data-testid="input-gallery-id-contenedor"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormItem>
                      <FormLabel>Imagen (opcional)</FormLabel>
                      <div className="space-y-2">
                        {selectedImage ? (
                          <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                            <img 
                              src={selectedImage.data} 
                              alt="Vista previa" 
                              className="w-16 h-16 object-cover rounded"
                            />
                            <span className="flex-1 text-sm truncate">{selectedImage.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveImage}
                              data-testid="button-gallery-remove-image"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => document.getElementById('gallery-image-upload')?.click()}
                              data-testid="button-gallery-upload-image"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Subir imagen
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => document.getElementById('gallery-camera-capture')?.click()}
                              data-testid="button-gallery-take-photo"
                            >
                              <Camera className="w-4 h-4 mr-2" />
                              Tomar foto
                            </Button>
                          </div>
                        )}
                        <input
                          id="gallery-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                        <input
                          id="gallery-camera-capture"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    </FormItem>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBackToGallery}
                        data-testid="button-gallery-cancel"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        data-testid="button-gallery-save"
                      >
                        {createMutation.isPending ? "Guardando..." : "Guardar Objeto"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="flex flex-row items-start justify-between">
                <div>
                  <DialogTitle className="text-xl">Galería de Objetos</DialogTitle>
                  <DialogDescription>
                    Busca y visualiza los objetos del inventario
                  </DialogDescription>
                </div>
                <Button
                  onClick={handleAddObject}
                  size="icon"
                  className="h-10 w-10 rounded-full shrink-0"
                  title="Añadir objeto"
                  data-testid="button-add-object-gallery"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogHeader>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="input-search-objects"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchTerm("")}
                    data-testid="clear-search-objects"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-auto mt-4 min-h-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ImageOff className="w-12 h-12 mb-4" />
                    <p>
                      {searchTerm
                        ? "No se encontraron objetos con ese nombre"
                        : "No hay objetos en el inventario"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                    {filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className={`relative rounded-lg overflow-hidden border border-border bg-card ${
                          item.imageDocument
                            ? "cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                            : "opacity-60"
                        }`}
                        onClick={() => handleItemClick(item)}
                        data-testid={`gallery-item-${item.id}`}
                      >
                        <div className="aspect-square">
                          {item.imageDocument ? (
                            <img
                              src={item.imageDocument}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <ImageOff className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-card">
                          <p className="text-sm font-medium truncate" title={item.name}>
                            {item.name}
                          </p>
                          {item.idContenedor && (
                            <p className="text-xs text-primary font-medium truncate" title={item.idContenedor}>
                              {item.idContenedor}
                            </p>
                          )}
                          {item.location && (
                            <p className="text-xs text-muted-foreground truncate" title={item.location}>
                              {item.location}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-muted-foreground">
                  {filteredItems.length} objeto{filteredItems.length !== 1 ? "s" : ""}
                </span>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="outline"
                  data-testid="close-gallery-modal"
                >
                  Cerrar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ObjectDetailModal
        item={selectedItem}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </>
  );
}
