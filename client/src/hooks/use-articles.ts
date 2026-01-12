import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Article, InsertArticle } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useArticles() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: articles,
    isLoading,
    error,
  } = useQuery<Article[]>({
    queryKey: ['/api/articles', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/articles?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createArticle = useMutation({
    mutationFn: async (article: InsertArticle) => {
      const response = await apiRequest('POST', '/api/articles', article);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/articles', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Artículo agregado",
        description: "El artículo se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el artículo.",
        variant: "destructive",
      });
    },
  });

  const updateArticle = useMutation({
    mutationFn: async ({ id, article }: { id: string; article: Partial<InsertArticle> }) => {
      const response = await apiRequest('PUT', `/api/articles/${id}`, article);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/articles', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Artículo actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el artículo.",
        variant: "destructive",
      });
    },
  });

  const deleteArticle = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/articles/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/articles', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Artículo eliminado",
        description: "El artículo se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el artículo.",
        variant: "destructive",
      });
    },
  });

  return {
    articles,
    isLoading,
    error,
    createArticle,
    updateArticle,
    deleteArticle,
  };
}
