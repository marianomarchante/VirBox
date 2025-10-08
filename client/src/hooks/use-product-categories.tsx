import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ProductCategory, InsertProductCategory } from "@shared/schema";

export function useProductCategories() {
  return useQuery<ProductCategory[]>({
    queryKey: ['/api/product-categories'],
  });
}

export function useProductCategory(id: string | undefined) {
  return useQuery<ProductCategory>({
    queryKey: ['/api/product-categories', id],
    enabled: !!id,
  });
}

export function useCreateProductCategory() {
  return useMutation({
    mutationFn: async (data: InsertProductCategory) => {
      return await apiRequest('POST', '/api/product-categories', data);
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
