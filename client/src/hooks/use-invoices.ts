import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Invoice, InsertInvoice } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useInvoices() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: invoices,
    isLoading,
    error,
  } = useQuery<Invoice[]>({
    queryKey: ['/api/invoices', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/invoices?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: InsertInvoice & { lines: Array<{ articleId?: string; quantity: string; unitPrice: string; vatRate: string; description: string }> }) => {
      const response = await apiRequest('POST', '/api/invoices', invoice);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/invoices', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Factura creada",
        description: "La factura se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la factura.",
        variant: "destructive",
      });
    },
  });

  const createInvoiceFromDeliveryNotes = useMutation({
    mutationFn: async (data: { deliveryNoteIds: string[]; invoiceData: Partial<InsertInvoice> }) => {
      const response = await apiRequest('POST', '/api/invoices/from-delivery-notes', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/invoices', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/delivery-notes', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Factura creada",
        description: "La factura se ha generado desde los albaranes seleccionados.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la factura desde los albaranes.",
        variant: "destructive",
      });
    },
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, invoice }: { id: string; invoice: Partial<InsertInvoice> }) => {
      const response = await apiRequest('PUT', `/api/invoices/${id}`, invoice);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/invoices', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Factura actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la factura.",
        variant: "destructive",
      });
    },
  });

  const deleteInvoice = useMutation({
    mutationFn: async ({ id, confirmCif }: { id: string; confirmCif: string }) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      params.append('confirmCif', confirmCif);
      await apiRequest('DELETE', `/api/invoices/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/invoices', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Factura eliminada",
        description: "La factura se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la factura.",
        variant: "destructive",
      });
    },
  });

  return {
    invoices,
    isLoading,
    error,
    createInvoice,
    createInvoiceFromDeliveryNotes,
    updateInvoice,
    deleteInvoice,
  };
}
