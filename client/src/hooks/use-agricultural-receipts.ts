import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AgriculturalReceipt } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useAgriculturalReceipts() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: receipts,
    isLoading,
    error,
  } = useQuery<AgriculturalReceipt[]>({
    queryKey: ['/api/agricultural-receipts', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/agricultural-receipts?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createReceipt = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/agricultural-receipts', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agricultural-receipts', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/transactions'],
        exact: false
      });
      toast({
        title: "Recibo agrario creado",
        description: "El recibo de compensación agraria se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el recibo agrario.",
        variant: "destructive",
      });
    },
  });

  const updateReceipt = useMutation({
    mutationFn: async ({ id, receipt }: { id: string; receipt: any }) => {
      const response = await apiRequest('PUT', `/api/agricultural-receipts/${id}`, receipt);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agricultural-receipts', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Recibo actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el recibo agrario.",
        variant: "destructive",
      });
    },
  });

  const deleteReceipt = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/agricultural-receipts/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/agricultural-receipts', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/transactions'],
        exact: false
      });
      toast({
        title: "Recibo eliminado",
        description: "El recibo agrario se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el recibo agrario.",
        variant: "destructive",
      });
    },
  });

  return {
    receipts,
    isLoading,
    error,
    createReceipt,
    updateReceipt,
    deleteReceipt,
  };
}
