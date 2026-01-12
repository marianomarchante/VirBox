import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DeliveryNote, InsertDeliveryNote } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useDeliveryNotes() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: deliveryNotes,
    isLoading,
    error,
  } = useQuery<DeliveryNote[]>({
    queryKey: ['/api/delivery-notes', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/delivery-notes?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createDeliveryNote = useMutation({
    mutationFn: async (deliveryNote: InsertDeliveryNote & { lines: Array<{ articleId: string; quantity: string; unitPrice: string; vatRate: string; description?: string }> }) => {
      const response = await apiRequest('POST', '/api/delivery-notes', deliveryNote);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/delivery-notes', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Albarán creado",
        description: "El albarán se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el albarán.",
        variant: "destructive",
      });
    },
  });

  const updateDeliveryNote = useMutation({
    mutationFn: async ({ id, deliveryNote }: { id: string; deliveryNote: Partial<InsertDeliveryNote> }) => {
      const response = await apiRequest('PUT', `/api/delivery-notes/${id}`, deliveryNote);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/delivery-notes', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Albarán actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el albarán.",
        variant: "destructive",
      });
    },
  });

  const deleteDeliveryNote = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/delivery-notes/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/delivery-notes', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Albarán eliminado",
        description: "El albarán se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el albarán.",
        variant: "destructive",
      });
    },
  });

  return {
    deliveryNotes,
    isLoading,
    error,
    createDeliveryNote,
    updateDeliveryNote,
    deleteDeliveryNote,
  };
}
