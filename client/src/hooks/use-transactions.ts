import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Transaction, InsertTransaction, TransactionFilter } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";

export function useTransactions(filter?: TransactionFilter) {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  // Build query string from filter
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    
    if (currentCompanyId) {
      params.append('companyId', currentCompanyId);
    }
    
    if (filter) {
      Object.entries(filter).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });
    }
    return params.toString() ? `?${params.toString()}` : '';
  }, [filter, currentCompanyId]);

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions', { companyId: currentCompanyId, filter }],
    queryFn: async () => {
      const res = await fetch(`/api/transactions${queryString}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createTransaction = useMutation({
    mutationFn: async (transaction: InsertTransaction) => {
      const response = await apiRequest('POST', '/api/transactions', transaction);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/transactions', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/dashboard/metrics', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/dashboard/monthly-data', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Transacción creada",
        description: "La transacción se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la transacción. Intenta nuevamente.",
        variant: "destructive",
      });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async ({ id, transaction }: { id: string; transaction: Partial<InsertTransaction> }) => {
      const response = await apiRequest('PUT', `/api/transactions/${id}`, transaction);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/transactions', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/dashboard/metrics', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/dashboard/monthly-data', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Transacción actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la transacción.",
        variant: "destructive",
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/transactions/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/transactions', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/dashboard/metrics', { companyId: currentCompanyId }],
        exact: false
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/dashboard/monthly-data', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Transacción eliminada",
        description: "La transacción se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la transacción.",
        variant: "destructive",
      });
    },
  });

  // Apply client-side filtering if needed
  const filteredTransactions = useMemo(() => {
    if (!transactions || !filter) return transactions;
    
    return transactions.filter(transaction => {
      // Additional client-side filtering can be added here if needed
      return true;
    });
  }, [transactions, filter]);

  return {
    transactions,
    filteredTransactions,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
