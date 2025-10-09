import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Supplier, InsertSupplier } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useSuppliers() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: suppliers,
    isLoading,
    error,
  } = useQuery<Supplier[]>({
    queryKey: ['/api/suppliers', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/suppliers?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createSupplier = useMutation({
    mutationFn: async (supplier: InsertSupplier) => {
      const response = await apiRequest('POST', '/api/suppliers', supplier);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/suppliers', { companyId: currentCompanyId }],
        exact: false
      });
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
      queryClient.invalidateQueries({ 
        queryKey: ['/api/suppliers', { companyId: currentCompanyId }],
        exact: false
      });
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
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/suppliers/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/suppliers', { companyId: currentCompanyId }],
        exact: false
      });
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

  return {
    suppliers,
    isLoading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  };
}

export function useSupplier(id: string | undefined) {
  const { currentCompanyId } = useCompany();
  
  return useQuery<Supplier>({
    queryKey: ['/api/suppliers', id, { companyId: currentCompanyId }],
    queryFn: async () => {
      const res = await fetch(`/api/suppliers/${id}`, { 
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
