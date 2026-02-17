import { useState, useMemo, useCallback } from "react";
import { Search, X, ImageOff, MapPin, Box, Plus, Upload, Camera, Printer } from "lucide-react";
import jsPDF from "jspdf";
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
      <DialogContent className="w-[100vw] h-[100dvh] max-w-none sm:max-w-[90vw] sm:h-auto md:max-w-[600px] sm:max-h-[95vh] rounded-none sm:rounded-lg overflow-y-auto p-0">
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedContainerFilter, setSelectedContainerFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ name: string; data: string } | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printRows, setPrintRows] = useState("8");
  const [printCols, setPrintCols] = useState("3");
  const [printStartLabel, setPrintStartLabel] = useState("1");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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

  const optimizeImage = (file: File, maxSizeKB: number = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        let { width, height } = img;
        const maxDimension = 1200;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        let quality = 0.9;
        let result = canvas.toDataURL('image/jpeg', quality);
        
        while (result.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL('image/jpeg', quality);
        }
        
        if (result.length > maxSizeKB * 1024 * 1.37 && (width > 800 || height > 800)) {
          const scale = 0.7;
          canvas.width = width * scale;
          canvas.height = height * scale;
          ctx?.drawImage(img, 0, 0, width * scale, height * scale);
          result = canvas.toDataURL('image/jpeg', 0.8);
        }
        
        resolve(result);
      };
      
      img.onerror = () => reject(new Error('Error al cargar la imagen'));
      
      const reader = new FileReader();
      reader.onload = () => { img.src = reader.result as string; };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Solo se permiten archivos de imagen.", variant: "destructive" });
        return;
      }
      try {
        const optimizedBase64 = await optimizeImage(file, 400);
        setSelectedImage({ name: file.name, data: optimizedBase64 });
        form.setValue('imageDocument', optimizedBase64);
        form.setValue('imageFileName', file.name);
      } catch {
        toast({ title: "Error", description: "No se pudo procesar la imagen.", variant: "destructive" });
      }
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    form.setValue('imageDocument', '');
    form.setValue('imageFileName', '');
  };

  const uniqueContainers = useMemo(() => {
    const containers = inventoryItems
      .map(item => item.idContenedor)
      .filter((c): c is string => !!c && c.trim() !== "");
    return Array.from(new Set(containers)).sort();
  }, [inventoryItems]);

  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const lowerSearch = searchTerm.trim().toLowerCase();
      const matchesSearch = lowerSearch === "" || item.name.toLowerCase().includes(lowerSearch);
      const matchesCategory = selectedCategoryFilter === "all" || 
        (selectedCategoryFilter === "none" && !item.categoryId) ||
        item.categoryId === selectedCategoryFilter;
      const matchesContainer = selectedContainerFilter === "all" ||
        (selectedContainerFilter === "none" && (!item.idContenedor || item.idContenedor.trim() === "")) ||
        item.idContenedor === selectedContainerFilter;
      return matchesSearch && matchesCategory && matchesContainer;
    });
  }, [inventoryItems, searchTerm, selectedCategoryFilter, selectedContainerFilter]);

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
      setSelectedCategoryFilter("all");
      setSelectedContainerFilter("all");
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

  const handleOpenPrintDialog = () => {
    setPrintRows("8");
    setPrintCols("3");
    setPrintStartLabel("1");
    setIsPrintDialogOpen(true);
  };

  const handleGeneratePdf = useCallback(async () => {
    const rows = parseInt(printRows, 10);
    const cols = parseInt(printCols, 10);
    const startLabel = parseInt(printStartLabel, 10);

    if (!rows || rows < 1 || !cols || cols < 1 || !startLabel || startLabel < 1) {
      toast({ title: "Error", description: "Los valores deben ser números enteros positivos.", variant: "destructive" });
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = 210;
      const pageHeight = 297;
      const marginX = 5;
      const marginY = 5;
      const usableWidth = pageWidth - marginX * 2;
      const usableHeight = pageHeight - marginY * 2;
      const cellWidth = usableWidth / cols;
      const cellHeight = usableHeight / rows;
      const padding = 1.5;
      const labelsPerPage = rows * cols;

      const items = filteredItems;
      const totalLabels = items.length + (startLabel - 1);
      const totalPages = Math.ceil(totalLabels / labelsPerPage);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const labelIndex = page * labelsPerPage + row * cols + col;
            const itemIndex = labelIndex - (startLabel - 1);

            if (labelIndex < startLabel - 1 || itemIndex >= items.length) continue;

            const item = items[itemIndex];
            const x = marginX + col * cellWidth;
            const y = marginY + row * cellHeight;

            doc.setDrawColor(200, 200, 200);
            doc.rect(x, y, cellWidth, cellHeight);

            const contentX = x + padding;
            const contentY = y + padding;
            const contentWidth = cellWidth - padding * 2;
            const contentHeight = cellHeight - padding * 2;

            const textAreaHeight = item.idContenedor || item.location ? 10 : 6;
            const imageAreaHeight = contentHeight - textAreaHeight;

            if (item.imageDocument) {
              try {
                const imgSize = Math.min(contentWidth, imageAreaHeight) - 1;
                const imgX = contentX + (contentWidth - imgSize) / 2;
                const imgY = contentY;
                doc.addImage(item.imageDocument, "JPEG", imgX, imgY, imgSize, imgSize);
              } catch {
                doc.setFontSize(6);
                doc.setTextColor(150, 150, 150);
                doc.text("Sin imagen", contentX + contentWidth / 2, contentY + imageAreaHeight / 2, { align: "center" });
              }
            } else {
              doc.setFontSize(6);
              doc.setTextColor(150, 150, 150);
              doc.text("Sin imagen", contentX + contentWidth / 2, contentY + imageAreaHeight / 2, { align: "center" });
            }

            let textY = contentY + imageAreaHeight + 1;
            const maxTextWidth = contentWidth - 1;

            const fitFontSize = (text: string, font: string, style: string, maxW: number, maxSize: number, minSize: number): number => {
              let size = maxSize;
              doc.setFont(font, style);
              while (size > minSize) {
                doc.setFontSize(size);
                const w = doc.getTextWidth(text);
                if (w <= maxW) break;
                size -= 0.5;
              }
              return size;
            };

            const nameFontSize = fitFontSize(item.name, "helvetica", "bold", maxTextWidth, cellHeight * 0.4, 4);
            const lineHeight = nameFontSize * 0.45;

            doc.setFont("helvetica", "bold");
            doc.setFontSize(nameFontSize);
            doc.setTextColor(0, 0, 0);
            doc.text(item.name, contentX + contentWidth / 2, textY, { align: "center", maxWidth: maxTextWidth });
            textY += lineHeight;

            if (item.idContenedor) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(nameFontSize);
              doc.setTextColor(0, 100, 0);
              doc.text(item.idContenedor, contentX + contentWidth / 2, textY, { align: "center", maxWidth: maxTextWidth });
              textY += lineHeight;
            }

            if (item.location) {
              const locFontSize = Math.max(nameFontSize * 0.75, 4);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(locFontSize);
              doc.setTextColor(100, 100, 100);
              doc.text(item.location, contentX + contentWidth / 2, textY, { align: "center", maxWidth: maxTextWidth });
            }
          }
        }
      }

      doc.save("Galeria_Objetos.pdf");
      toast({ title: "PDF generado", description: `Se ha generado el PDF con ${items.length} etiqueta${items.length !== 1 ? "s" : ""}.` });
      setIsPrintDialogOpen(false);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "Error", description: "No se pudo generar el PDF.", variant: "destructive" });
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [filteredItems, printRows, printCols, printStartLabel, toast]);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[100vw] h-[100dvh] max-w-none sm:max-w-[95vw] sm:h-auto md:max-w-[900px] sm:max-h-[95vh] rounded-none sm:rounded-lg overflow-hidden flex flex-col p-3 sm:p-6">
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
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                data-testid="input-gallery-value"
                                onChange={(e) => {
                                  const val = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                  field.onChange(val);
                                }}
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
                <div className="flex gap-2 shrink-0">
                  <Button
                    onClick={handleOpenPrintDialog}
                    size="icon"
                    variant="outline"
                    className="h-10 w-10 rounded-full"
                    title="Imprimir etiquetas"
                    disabled={filteredItems.length === 0}
                    data-testid="button-print-gallery"
                  >
                    <Printer className="h-5 w-5" />
                  </Button>
                  <Button
                    onClick={handleAddObject}
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    title="Añadir objeto"
                    data-testid="button-add-object-gallery"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
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
                <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-gallery-category-filter">
                    <SelectValue placeholder="Filtrar por categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {productCategories?.filter(c => c.isActive).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedContainerFilter} onValueChange={setSelectedContainerFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-gallery-container-filter">
                    <Box className="w-4 h-4 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por contenedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los contenedores</SelectItem>
                    <SelectItem value="none">Sin contenedor</SelectItem>
                    {uniqueContainers.map((container) => (
                      <SelectItem key={container} value={container}>
                        {container}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      {searchTerm || selectedCategoryFilter !== "all" || selectedContainerFilter !== "all"
                        ? "No se encontraron objetos con esos filtros"
                        : "No hay objetos en el inventario"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 pb-4">
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

      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configurar impresión de etiquetas</DialogTitle>
            <DialogDescription>
              Configure el formato de la cuadrícula en página A4
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" htmlFor="print-rows">Filas por página</label>
                <Input
                  id="print-rows"
                  type="number"
                  min="1"
                  max="20"
                  value={printRows}
                  onChange={(e) => setPrintRows(e.target.value)}
                  data-testid="input-print-rows"
                />
              </div>
              <div>
                <label className="text-sm font-medium" htmlFor="print-cols">Columnas por página</label>
                <Input
                  id="print-cols"
                  type="number"
                  min="1"
                  max="10"
                  value={printCols}
                  onChange={(e) => setPrintCols(e.target.value)}
                  data-testid="input-print-cols"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="print-start">Empezar en etiqueta nº</label>
              <Input
                id="print-start"
                type="number"
                min="1"
                value={printStartLabel}
                onChange={(e) => setPrintStartLabel(e.target.value)}
                data-testid="input-print-start-label"
              />
              <p className="text-xs text-muted-foreground mt-1">
                La primera etiqueta es la esquina superior izquierda. El orden es de izquierda a derecha, fila a fila.
              </p>
            </div>
            <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
              {filteredItems.length} objeto{filteredItems.length !== 1 ? "s" : ""} a imprimir
              {parseInt(printRows) > 0 && parseInt(printCols) > 0 && (
                <> · {Math.ceil((filteredItems.length + Math.max(0, parseInt(printStartLabel) - 1)) / (parseInt(printRows) * parseInt(printCols))) || 1} página{Math.ceil((filteredItems.length + Math.max(0, parseInt(printStartLabel) - 1)) / (parseInt(printRows) * parseInt(printCols))) !== 1 ? "s" : ""}</>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPrintDialogOpen(false)}
                data-testid="button-cancel-print"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGeneratePdf}
                disabled={isGeneratingPdf}
                data-testid="button-generate-pdf"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isGeneratingPdf ? "Generando..." : "Generar PDF"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
