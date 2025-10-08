import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Inventory, InsertInventory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useInventory() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: inventory,
    isLoading,
    error,
  } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory', { companyId: currentCompanyId }],
    queryFn: async () => {
      const res = await fetch('/api/inventory', { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createInventoryItem = useMutation({
    mutationFn: async (item: InsertInventory) => {
      const response = await apiRequest('POST', '/api/inventory', item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Producto agregado",
        description: "El producto se ha agregado al inventario correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al inventario.",
        variant: "destructive",
      });
    },
  });

  const updateInventoryItem = useMutation({
    mutationFn: async ({ id, item }: { id: string; item: Partial<InsertInventory> }) => {
      const response = await apiRequest('PUT', `/api/inventory/${id}`, item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Producto actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      });
    },
  });

  const deleteInventoryItem = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado del inventario.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    },
  });

  return {
    inventory,
    isLoading,
    error,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
  };
}

export function useInventoryItem(id: string | undefined) {
  const { currentCompanyId } = useCompany();
  
  return useQuery<Inventory>({
    queryKey: ['/api/inventory', id, { companyId: currentCompanyId }],
    queryFn: async () => {
      const res = await fetch(`/api/inventory/${id}`, { 
        credentials: "include" 
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!id && !!currentCompanyId,
  });
}
