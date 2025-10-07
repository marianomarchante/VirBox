import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Client, InsertClient } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useClients() {
  const { toast } = useToast();

  const {
    data: clients,
    isLoading,
    error,
  } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const createClient = useMutation({
    mutationFn: async (client: InsertClient) => {
      const response = await apiRequest('POST', '/api/clients', client);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente agregado",
        description: "El cliente se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el cliente.",
        variant: "destructive",
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, client }: { id: string; client: Partial<InsertClient> }) => {
      const response = await apiRequest('PUT', `/api/clients/${id}`, client);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente.",
        variant: "destructive",
      });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    },
  });

  const getClientById = (id: string) => {
    return useQuery<Client>({
      queryKey: ['/api/clients', id],
      enabled: !!id,
    });
  };

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    getClientById,
  };
}
