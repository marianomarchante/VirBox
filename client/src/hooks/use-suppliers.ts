import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Supplier, InsertSupplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useSuppliers() {
  const { toast } = useToast();

  const {
    data: suppliers,
    isLoading,
    error,
  } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers'],
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: InsertSupplier) => {
      const response = await apiRequest('POST', '/api/suppliers', supplier);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Proveedor agregado",
        description: "El proveedor se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el proveedor.",
        variant: "destructive",
      });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, supplier }: { id: string; supplier: Partial<InsertSupplier> }) => {
      const response = await apiRequest('PUT', `/api/suppliers/${id}`, supplier);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Proveedor actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el proveedor.",
        variant: "destructive",
      });
    },
  });

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/suppliers'] });
      toast({
        title: "Proveedor eliminado",
        description: "El proveedor se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el proveedor.",
        variant: "destructive",
      });
    },
  });

  const getSupplierById = (id: string) => {
    return useQuery<Supplier>({
      queryKey: ['/api/suppliers', id],
      enabled: !!id,
    });
  };

  return {
    suppliers,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
  };
}
