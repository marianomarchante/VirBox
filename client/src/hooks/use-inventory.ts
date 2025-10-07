import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Inventory, InsertInventory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useInventory() {
  const { toast } = useToast();

  const {
    data: inventory,
    isLoading,
    error,
  } = useQuery<Inventory[]>({
    queryKey: ['/api/inventory'],
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

  const getInventoryById = (id: string) => {
    return useQuery<Inventory>({
      queryKey: ['/api/inventory', id],
      enabled: !!id,
    });
  };

  return {
    inventory,
    isLoading,
    error,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getInventoryById,
  };
}
