import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductCategory, InsertProductCategory } from "@shared/schema";
import { useCompany } from "@/contexts/CompanyContext";

export function useProductCategories() {
  const { currentCompanyId } = useCompany();
  
  return useQuery<ProductCategory[]>({
    queryKey: ['/api/product-categories', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const url = `/api/product-categories?${params.toString()}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });
}

export function useProductCategory(id: string | undefined) {
  return useQuery<ProductCategory>({
    queryKey: ['/api/product-categories', id],
    enabled: !!id,
  });
}

export function useCreateProductCategory() {
  const { currentCompanyId } = useCompany();
  
  return useMutation({
    mutationFn: async (data: InsertProductCategory) => {
      return await apiRequest('POST', '/api/product-categories', {
        ...data,
        companyId: currentCompanyId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
    },
  });
}

export function useUpdateProductCategory() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProductCategory> }) => {
      return await apiRequest('PUT', `/api/product-categories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
    },
  });
}

export function useDeleteProductCategory() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/product-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/product-categories'] });
    },
  });
}
