import { useState } from "react";
import { Plus, Users, Edit, Trash2, Search, Phone, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertMemberSchema, type InsertMember, type Member, type MemberType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { Badge } from "@/components/ui/badge";

export default function Members() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterTypeId, setFilterTypeId] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<string>("all");
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ["/api/members", currentCompanyId, filterTypeId, filterActive, search],
    queryFn: async () => {
      const params = new URLSearchParams({ companyId: currentCompanyId! });
      if (filterTypeId !== "all") params.append("memberTypeId", filterTypeId);
      if (filterActive !== "all") params.append("isActive", filterActive);
      if (search) params.append("search", search);
      const res = await apiRequest("GET", `/api/members?${params}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const { data: memberTypes = [] } = useQuery<MemberType[]>({
    queryKey: ["/api/member-types", currentCompanyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/member-types?companyId=${currentCompanyId}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const { data: nextNumberData } = useQuery<{ nextNumber: string }>({
    queryKey: ["/api/members/next-number", currentCompanyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/members/next-number?companyId=${currentCompanyId}`);
      return res.json();
    },
    enabled: !!currentCompanyId && isModalOpen && !editingId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      const res = await apiRequest("POST", "/api/members", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members/next-number"] });
      toast({ title: "Socio creado correctamente." });
      handleClose();
    },
    onError: (e: any) => toast({ title: "Error al crear el socio.", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertMember> }) => {
      const res = await apiRequest("PUT", `/api/members/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Socio actualizado correctamente." });
      handleClose();
    },
    onError: () => toast({ title: "Error al actualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({ title: "Socio eliminado." });
    },
    onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
  });

  const form = useForm<InsertMember>({
    resolver: zodResolver(insertMemberSchema),
    defaultValues: {
      memberNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: null,
      joinDate: new Date().toISOString().split("T")[0],
      memberTypeId: "",
      feeAmount: "0.00",
      isActive: true,
      notes: "",
    },
  });

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingId(null);
    form.reset();
  };

  const handleNew = () => {
    form.reset({
      memberNumber: nextNumberData?.nextNumber ?? "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      birthDate: null,
      joinDate: new Date().toISOString().split("T")[0],
      memberTypeId: memberTypes[0]?.id ?? "",
      feeAmount: memberTypes[0]?.feeAmount ?? "0.00",
      isActive: true,
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (m: Member) => {
    setEditingId(m.id);
    form.reset({
      memberNumber: m.memberNumber,
      firstName: m.firstName,
      lastName: m.lastName,
      email: m.email ?? "",
      phone: m.phone ?? "",
      birthDate: m.birthDate ?? null,
      joinDate: m.joinDate,
      memberTypeId: m.memberTypeId,
      feeAmount: m.feeAmount ?? "0.00",
      isActive: m.isActive,
      notes: m.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = (m: Member) => {
    if (window.confirm(`¿Eliminar al socio "${m.firstName} ${m.lastName}"? Se eliminarán también sus pagos de cuotas.`)) {
      deleteMutation.mutate(m.id);
    }
  };

  const onSubmit = (data: InsertMember) => {
    const payload = { ...data, companyId: currentCompanyId! };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const getMemberTypeName = (id: string) => memberTypes.find((t) => t.id === id)?.name ?? "—";

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-ES");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Socios"
          subtitle="Registro de socios de la asociación"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <div className="p-4 lg:p-8 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o nº de socio..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                id="input-search-members"
              />
            </div>
            <Select value={filterTypeId} onValueChange={setFilterTypeId}>
              <SelectTrigger className="w-full sm:w-48" id="select-filter-type">
                <SelectValue placeholder="Tipo de socio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {memberTypes.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-full sm:w-36" id="select-filter-active">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Activos</SelectItem>
                <SelectItem value="false">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Socios</h3>
                <p className="text-sm text-muted-foreground">{members.length} socios encontrados</p>
              </div>
              <Button onClick={handleNew} id="btn-add-member">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Socio
              </Button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No se encontraron socios</p>
                <p className="text-sm">Añade el primer socio con el botón de arriba.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Nº</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Socio</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Cuota</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Contacto</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">F. Inscripción</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm font-semibold text-primary">#{m.memberNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {m.firstName[0]}{m.lastName[0]}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{m.firstName} {m.lastName}</p>
                              {m.birthDate && (
                                <p className="text-xs text-muted-foreground">{formatDate(m.birthDate)}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{getMemberTypeName(m.memberTypeId)}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {Number(m.feeAmount ?? 0).toFixed(2)} €
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            {m.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</div>}
                            {m.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{m.email}</div>}
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(m.joinDate)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={m.isActive ? "default" : "secondary"}>
                            {m.isActive ? "Activo" : "Baja"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(m)} id={`btn-edit-member-${m.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(m)} id={`btn-delete-member-${m.id}`}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Socio" : "Nuevo Socio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-number">Nº de Socio *</Label>
                <Input id="m-number" placeholder="0001" {...form.register("memberNumber")} />
                {form.formState.errors.memberNumber && (
                  <p className="text-xs text-destructive">{form.formState.errors.memberNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-type">Tipo de Socio *</Label>
                <Controller
                  name="memberTypeId"
                  control={form.control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={(val) => {
                        field.onChange(val);
                        const selectedType = memberTypes.find(t => t.id === val);
                        if (selectedType) {
                          form.setValue("feeAmount", selectedType.feeAmount ?? "0.00", { shouldValidate: true });
                        }
                      }}
                    >
                      <SelectTrigger id="m-type">
                        <SelectValue placeholder="Seleccionar tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {memberTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.memberTypeId && (
                  <p className="text-xs text-destructive">{form.formState.errors.memberTypeId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-fee">Cuota del socio (€) *</Label>
                <Input id="m-fee" type="number" step="0.01" {...form.register("feeAmount")} />
                {form.formState.errors.feeAmount && (
                  <p className="text-xs text-destructive">{form.formState.errors.feeAmount.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-first">Nombre *</Label>
                <Input id="m-first" placeholder="Nombre" {...form.register("firstName")} />
                {form.formState.errors.firstName && (
                  <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-last">Apellidos *</Label>
                <Input id="m-last" placeholder="Apellidos" {...form.register("lastName")} />
                {form.formState.errors.lastName && (
                  <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-phone">Teléfono</Label>
                <Input id="m-phone" type="tel" placeholder="600 000 000" {...form.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-email">Email</Label>
                <Input id="m-email" type="email" placeholder="correo@ejemplo.com" {...form.register("email")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="m-birth">Fecha de Nacimiento</Label>
                <Input id="m-birth" type="date" {...form.register("birthDate")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-join">Fecha de Inscripción *</Label>
                <Input id="m-join" type="date" {...form.register("joinDate")} />
                {form.formState.errors.joinDate && (
                  <p className="text-xs text-destructive">{form.formState.errors.joinDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="m-notes">Notas</Label>
              <Textarea id="m-notes" placeholder="Observaciones opcionales..." {...form.register("notes")} rows={2} />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="m-active" {...form.register("isActive")} className="rounded" />
              <Label htmlFor="m-active" className="cursor-pointer">Socio activo</Label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Guardar cambios" : "Crear socio"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
