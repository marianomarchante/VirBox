import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type Category, type InsertCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useCategories(type?: 'income' | 'expense') {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();
  
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', { companyId: currentCompanyId, type }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      if (type) params.append('type', type);
      const url = `/api/categories?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createCategory = useMutation({
    mutationFn: async (category: InsertCategory) => {
      const response = await apiRequest('POST', '/api/categories', {
        ...category,
        companyId: currentCompanyId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/categories'],
        refetchType: 'all'
      });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría",
        variant: "destructive",
      });
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, category }: { id: string; category: Partial<InsertCategory> }) => {
      const response = await apiRequest('PUT', `/api/categories/${id}`, category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/categories'],
        refetchType: 'all'
      });
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría",
        variant: "destructive",
      });
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/categories'],
        refetchType: 'all'
      });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría",
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
