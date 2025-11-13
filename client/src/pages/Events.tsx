import { useState, useMemo } from "react";
import { Plus, Calendar, Edit, Trash2, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useEvents } from "@/hooks/use-events";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { insertEventSchema, type InsertEvent } from "@shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Events() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'read'>('all');

  const { events, createEvent, updateEvent, deleteEvent, isLoading } = useEvents();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      date: new Date(),
      description: '',
    },
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    
    let filtered = events;

    // Filter by search
    if (searchFilter.trim()) {
      const searchLower = searchFilter.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.description.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(event => !event.isRead);
    } else if (statusFilter === 'read') {
      filtered = filtered.filter(event => event.isRead);
    }

    return filtered;
  }, [events, searchFilter, statusFilter]);

  const hasActiveFilters = searchFilter.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchFilter('');
    setStatusFilter('all');
  };

  const handleSubmit = (data: InsertEvent) => {
    if (editingEvent) {
      updateEvent.mutate({ id: editingEvent, event: { ...data, companyId: currentCompanyId ?? undefined } });
    } else {
      createEvent.mutate({ ...data, companyId: currentCompanyId ?? undefined });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
    form.reset({
      date: new Date(),
      description: '',
    });
  };

  const handleEdit = (eventId: string) => {
    const event = events?.find(e => e.id === eventId);
    if (event) {
      setEditingEvent(eventId);
      form.reset({
        date: new Date(event.date),
        description: event.description,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este evento?')) {
      deleteEvent.mutate(eventId);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: es });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {!hasCompanySelected ? (
        <div className="flex-1 flex items-center justify-center">
          <NoCompanySelected />
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando eventos...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Eventos"
            subtitle="Gestión de eventos importantes"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Lista de Eventos</h3>
                    <p className="text-sm text-muted-foreground">
                      {filteredEvents.length} {filteredEvents.length === events?.length ? 'eventos registrados' : `de ${events?.length || 0} eventos`}
                    </p>
                  </div>
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    data-testid="button-add-event"
                    disabled={!canWrite}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Evento
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar eventos por descripción..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-events"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'read')}
                  >
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los eventos</SelectItem>
                      <SelectItem value="pending">Pendientes</SelectItem>
                      <SelectItem value="read">Leídos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-fit"
                    data-testid="button-clear-filters"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            
              <div className="overflow-x-auto" data-testid="events-table">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Descripción
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Estado
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filteredEvents || filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                          {searchFilter ? 'No se encontraron eventos que coincidan con la búsqueda.' : 'No hay eventos registrados.'}
                          {!searchFilter && canWrite && (
                            <button 
                              onClick={() => setIsModalOpen(true)}
                              className="text-primary hover:underline ml-1"
                            >
                              Agregar el primero
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((event) => (
                        <tr 
                          key={event.id} 
                          className="transaction-row"
                          data-testid={`event-row-${event.id}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium">
                                {formatDate(event.date)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm text-foreground">{event.description}</p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center">
                              {event.isRead ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                  <Check className="w-3 h-3" />
                                  Leído
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                  <Calendar className="w-3 h-3" />
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(event.id)}
                                disabled={!canWrite}
                                data-testid={`button-edit-event-${event.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(event.id)}
                                disabled={!canWrite}
                                data-testid={`button-delete-event-${event.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Editar Evento' : 'Nuevo Evento'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" data-testid="event-form">
            <div>
              <Label htmlFor="date">Fecha del Evento *</Label>
              <Input
                id="date"
                type="date"
                value={form.watch('date') ? format(new Date(form.watch('date')), 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue('date', value ? new Date(value) : new Date());
                }}
                data-testid="input-event-date"
              />
              {form.formState.errors.date && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Describe el evento..."
                rows={4}
                data-testid="input-event-description"
              />
              {form.formState.errors.description && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                data-testid="button-cancel-event"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                data-testid="button-save-event"
              >
                {editingEvent ? 'Guardar Cambios' : 'Crear Evento'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
