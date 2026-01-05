import { useState, useMemo } from "react";
import { Search, X, ImageOff, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { type Inventory } from "@shared/schema";

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

export function ObjectsGallery({ trigger }: ObjectsGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { currentCompanyId } = useCompany();

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
    }
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[900px] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Galería de Objetos</DialogTitle>
            <DialogDescription>
              Busca y visualiza los objetos del inventario
            </DialogDescription>
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
