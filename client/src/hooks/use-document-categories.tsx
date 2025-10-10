import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type DocumentCategory, type InsertDocumentCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useDocumentCategories() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();
  
  const { data: categories, isLoading } = useQuery<DocumentCategory[]>({
    queryKey: ['/api/document-categories', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const url = `/api/document-categories?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createCategory = useMutation({
    mutationFn: async (category: InsertDocumentCategory) => {
      const response = await apiRequest('POST', '/api/document-categories', {
        ...category,
        companyId: currentCompanyId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/document-categories', { companyId: currentCompanyId }],
        exact: false,
        refetchType: 'all'
      });
      toast({
        title: "Categoría creada",
        description: "La categoría de documento se ha creado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría de documento",
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: Partial<InsertDocumentCategory> }) => {
      const response = await apiRequest('PUT', `/api/document-categories/${id}`, { ...category, companyId: currentCompanyId ?? undefined });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/document-categories', { companyId: currentCompanyId }],
        exact: false,
        refetchType: 'all'
      });
      toast({
        title: "Categoría actualizada",
        description: "La categoría de documento se ha actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría de documento",
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/document-categories/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/document-categories', { companyId: currentCompanyId }],
        exact: false,
        refetchType: 'all'
      });
      toast({
        title: "Categoría eliminada",
        description: "La categoría de documento se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría de documento",
        variant: "destructive",
      });
    },
  });

  return {
    categories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  };
}
