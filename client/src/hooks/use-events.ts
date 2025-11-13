import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Event, InsertEvent } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function useEvents() {
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const {
    data: events,
    isLoading,
    error,
  } = useQuery<Event[]>({
    queryKey: ['/api/events', { companyId: currentCompanyId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      const res = await fetch(`/api/events?${params.toString()}`, { credentials: "include" });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createEvent = useMutation({
    mutationFn: async (event: InsertEvent) => {
      const response = await apiRequest('POST', '/api/events', event);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Evento agregado",
        description: "El evento se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo agregar el evento.",
        variant: "destructive",
      });
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, event }: { id: string; event: Partial<InsertEvent> }) => {
      const response = await apiRequest('PUT', `/api/events/${id}`, event);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Evento actualizado",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el evento.",
        variant: "destructive",
      });
    },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const params = new URLSearchParams();
      if (currentCompanyId) params.append('companyId', currentCompanyId);
      await apiRequest('DELETE', `/api/events/${id}?${params.toString()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', { companyId: currentCompanyId }],
        exact: false
      });
      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento.",
        variant: "destructive",
      });
    },
  });

  return {
    events,
    isLoading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}

export function useEvent(id: string | undefined) {
  const { currentCompanyId } = useCompany();
  
  return useQuery<Event>({
    queryKey: ['/api/events', id, { companyId: currentCompanyId }],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`, { 
        credentials: "include" 
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!id && !!currentCompanyId,
  });
}
