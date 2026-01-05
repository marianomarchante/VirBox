import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Trash2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-events";
import { type Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function PastEventsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const hasCheckedRef = useRef(false);
  const { events, isLoading, deleteEvent, markAsRead } = useEvents();
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (hasCheckedRef.current || isLoading || !events || !currentCompany) {
      return;
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const filteredPastEvents = events.filter((event: Event) => {
      const eventDate = new Date(event.date);
      return eventDate <= today && !event.isRead;
    });

    if (filteredPastEvents.length > 0) {
      setPastEvents(filteredPastEvents);
      setIsOpen(true);
    }
    hasCheckedRef.current = true;
  }, [events, isLoading, currentCompany]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDelete = useCallback(async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
      const newPastEvents = pastEvents.filter(e => e.id !== eventId);
      setPastEvents(newPastEvents);
      
      if (newPastEvents.length === 0) {
        setIsOpen(false);
      }

      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento.",
        variant: "destructive",
      });
    }
  }, [deleteEvent, pastEvents, toast]);

  const handleMarkAsRead = useCallback(async (eventId: string) => {
    try {
      await markAsRead.mutateAsync(eventId);
      const newPastEvents = pastEvents.filter(e => e.id !== eventId);
      setPastEvents(newPastEvents);
      
      if (newPastEvents.length === 0) {
        setIsOpen(false);
      }

      toast({
        title: "Evento marcado como leído",
        description: "El evento ya no se mostrará en las notificaciones.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar el evento como leído.",
        variant: "destructive",
      });
    }
  }, [markAsRead, pastEvents, toast]);

  if (!isOpen || pastEvents.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="past-events-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Eventos Pendientes
          </DialogTitle>
          <DialogDescription>
            Tienes {pastEvents.length} evento{pastEvents.length !== 1 ? 's' : ''} con fecha actual o anterior
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {pastEvents.map((event) => (
            <div
              key={event.id}
              className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
              data-testid={`past-event-${event.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">
                      {format(new Date(event.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkAsRead(event.id)}
                    disabled={markAsRead.isPending}
                    className="text-primary hover:text-primary hover:bg-primary/10"
                    title="Marcar como leído"
                    data-testid={`mark-read-past-event-${event.id}`}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(event.id)}
                    disabled={deleteEvent.isPending}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Eliminar evento"
                    data-testid={`delete-past-event-${event.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button
            onClick={handleClose}
            variant="outline"
            data-testid="close-past-events-modal"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
