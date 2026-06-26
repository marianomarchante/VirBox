import { useState } from "react";
import { Plus, CalendarDays, Edit, Trash2, CheckCircle, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertSeasonSchema, type InsertSeason, type Season } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { Badge } from "@/components/ui/badge";

interface SeasonsApiResponse {
  seasons: Season[];
  suggestedNext: { name: string; startYear: number; endYear: number } | null;
}

export default function Seasons() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const { data, isLoading } = useQuery<SeasonsApiResponse>({
    queryKey: ["/api/seasons", currentCompanyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seasons?companyId=${currentCompanyId}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const seasons = data?.seasons ?? [];
  const suggestedNext = data?.suggestedNext;

  const createMutation = useMutation({
    mutationFn: async (d: InsertSeason) => {
      const res = await apiRequest("POST", "/api/seasons", d);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Temporada creada correctamente." });
      handleClose();
    },
    onError: () => toast({ title: "Error al crear la temporada.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSeason> }) => {
      const res = await apiRequest("PUT", `/api/seasons/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Temporada actualizada correctamente." });
      handleClose();
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/seasons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seasons"] });
      toast({ title: "Temporada eliminada." });
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  const form = useForm<InsertSeason>({
    resolver: zodResolver(insertSeasonSchema),
    defaultValues: { name: "", startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isActive: true },
  });

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleNewWithSuggestion = () => {
    if (suggestedNext) {
      form.reset({
        name: suggestedNext.name,
        startYear: suggestedNext.startYear,
        endYear: suggestedNext.endYear,
        isActive: true,
      });
    } else {
      form.reset({ name: "", startYear: new Date().getFullYear(), endYear: new Date().getFullYear() + 1, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (s: Season) => {
    setEditingId(s.id);
    form.reset({ name: s.name, startYear: s.startYear, endYear: s.endYear, isActive: s.isActive });
    setIsModalOpen(true);
  };

  const handleDelete = (s: Season) => {
    if (window.confirm(`¿Eliminar la temporada "${s.name}"? Se eliminarán también los pagos de cuotas asociados.`)) {
      deleteMutation.mutate(s.id);
    }
  };

  const onSubmit = (data: InsertSeason) => {
    const payload = { ...data, companyId: currentCompanyId! };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Auto-fill name when years change
  const watchStart = form.watch("startYear");
  const watchEnd = form.watch("endYear");
  const handleYearChange = () => {
    const s = form.getValues("startYear");
    const e = form.getValues("endYear");
    if (s && e) form.setValue("name", `${s}/${e}`);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Temporadas"
          subtitle="Gestión de temporadas interanuales de cuotas"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <div className="p-4 lg:p-8">
          {suggestedNext && (
            <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Siguiente temporada sugerida</p>
                  <p className="text-xs text-muted-foreground">{suggestedNext.name} — {suggestedNext.startYear} / {suggestedNext.endYear}</p>
                </div>
              </div>
              <Button size="sm" onClick={handleNewWithSuggestion} id="btn-create-suggested-season">
                <Plus className="w-3 h-3 mr-1" /> Crear {suggestedNext.name}
              </Button>
            </div>
          )}

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Temporadas</h3>
                <p className="text-sm text-muted-foreground">{seasons.length} temporadas registradas</p>
              </div>
              <Button onClick={handleNewWithSuggestion} id="btn-add-season">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Temporada
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : seasons.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay temporadas registradas</p>
                <p className="text-sm">Crea la primera temporada con el botón de arriba.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Temporada</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Año inicio</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Año fin</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasons.map((s) => (
                      <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <CalendarDays className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-semibold text-foreground">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-foreground">{s.startYear}</td>
                        <td className="py-3 px-4 text-center text-foreground">{s.endYear}</td>
                        <td className="py-3 px-4 text-center">
                          {s.isActive ? (
                            <Badge className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3" /> Activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Circle className="w-3 h-3" /> Inactiva
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} id={`btn-edit-season-${s.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s)} id={`btn-delete-season-${s.id}`}
                              className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Temporada" : "Nueva Temporada"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-start">Año inicio *</Label>
                <Input id="s-start" type="number" min="2000" max="2100" placeholder="2025"
                  {...form.register("startYear", { valueAsNumber: true, onChange: handleYearChange })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-end">Año fin *</Label>
                <Input id="s-end" type="number" min="2000" max="2100" placeholder="2026"
                  {...form.register("endYear", { valueAsNumber: true, onChange: handleYearChange })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-name">Nombre de la temporada</Label>
              <Input id="s-name" placeholder="Ej: 2025/2026" {...form.register("name")} />
              <p className="text-xs text-muted-foreground">Se genera automáticamente a partir de los años.</p>
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="s-active" {...form.register("isActive")} className="rounded" />
              <Label htmlFor="s-active" className="cursor-pointer">Temporada activa</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Guardar cambios" : "Crear temporada"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
