import { useState } from "react";
import { Plus, Tags, Edit, Trash2, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertMemberTypeSchema, type InsertMemberType, type MemberType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { Badge } from "@/components/ui/badge";

export default function MemberTypes() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const { data: memberTypes = [], isLoading } = useQuery<MemberType[]>({
    queryKey: ["/api/member-types", currentCompanyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/member-types?companyId=${currentCompanyId}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMemberType) => {
      const res = await apiRequest("POST", "/api/member-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-types"] });
      toast({ title: "Tipo de socio creado correctamente." });
      handleClose();
    },
    onError: () => toast({ title: "Error al crear el tipo de socio.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertMemberType> }) => {
      const res = await apiRequest("PUT", `/api/member-types/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-types"] });
      toast({ title: "Tipo de socio actualizado correctamente." });
      handleClose();
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/member-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-types"] });
      toast({ title: "Tipo de socio eliminado." });
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  const form = useForm<InsertMemberType>({
    resolver: zodResolver(insertMemberTypeSchema),
    defaultValues: { name: "", description: "", feeAmount: "0.00", isActive: true },
  });

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleEdit = (mt: MemberType) => {
    setEditingId(mt.id);
    form.reset({
      name: mt.name,
      description: mt.description ?? "",
      feeAmount: mt.feeAmount ?? "0.00",
      isActive: mt.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (mt: MemberType) => {
    if (window.confirm(`¿Eliminar el tipo de socio "${mt.name}"?`)) {
      deleteMutation.mutate(mt.id);
    }
  };

  const onSubmit = (data: InsertMemberType) => {
    const payload = { ...data, companyId: currentCompanyId! };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Tipos de Socio"
          subtitle="Categorías de socios y sus cuotas asociadas"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <div className="p-4 lg:p-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Tipos de Socio</h3>
                <p className="text-sm text-muted-foreground">{memberTypes.length} tipos registrados</p>
              </div>
              <Button onClick={() => setIsModalOpen(true)} id="btn-add-member-type">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Tipo
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : memberTypes.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Tags className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay tipos de socio registrados</p>
                <p className="text-sm">Crea el primer tipo con el botón de arriba.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Nombre</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Descripción</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Cuota (€)</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberTypes.map((mt) => (
                      <tr key={mt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Tags className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{mt.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{mt.description || "—"}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-foreground">
                            {parseFloat(mt.feeAmount ?? "0").toFixed(2)} €
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={mt.isActive ? "default" : "secondary"}>
                            {mt.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(mt)} id={`btn-edit-mt-${mt.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(mt)} id={`btn-delete-mt-${mt.id}`}
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
            <DialogTitle>{editingId ? "Editar Tipo de Socio" : "Nuevo Tipo de Socio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="mt-name">Nombre *</Label>
              <Input id="mt-name" placeholder="Ej: Adulto, Jubilado, Joven..." {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mt-description">Descripción</Label>
              <Textarea id="mt-description" placeholder="Descripción opcional..." {...form.register("description")} rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mt-fee">Cuota por temporada (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="mt-fee" type="number" step="0.01" min="0" placeholder="0.00"
                  className="pl-9" {...form.register("feeAmount")} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="mt-active" {...form.register("isActive")} className="rounded" />
              <Label htmlFor="mt-active" className="cursor-pointer">Activo</Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Guardar cambios" : "Crear tipo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
