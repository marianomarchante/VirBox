import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useEvents } from "@/hooks/use-events";
import { type Event } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";

export function PastEventsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const { events, isLoading, deleteEvent } = useEvents();
  const { toast } = useToast();
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (!isLoading && events && events.length > 0 && currentCompany) {
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      const filteredPastEvents = events.filter((event: Event) => {
        const eventDate = new Date(event.date);
        return eventDate <= today;
      });

      if (filteredPastEvents.length > 0) {
        setPastEvents(filteredPastEvents);
        setIsOpen(true);
      }
    }
  }, [events, isLoading, currentCompany]);

  const handleDelete = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
      setPastEvents(prev => prev.filter(e => e.id !== eventId));
      
      if (pastEvents.length === 1) {
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
  };

  if (!pastEvents.length || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="past-events-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="h-6 w-6 text-primary" />
            Eventos Pendientes
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Tienes {pastEvents.length} evento{pastEvents.length !== 1 ? 's' : ''} con fecha actual o anterior
          </p>
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
          ))}
        </div>

        <div className="flex justify-end mt-4 pt-4 border-t">
          <Button
            onClick={() => setIsOpen(false)}
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
