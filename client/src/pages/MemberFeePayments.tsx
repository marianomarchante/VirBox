import { useState } from "react";
import { CreditCard, CheckCircle, Circle, RefreshCw, Euro, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type MemberFeePayment, type Member, type Season, type MemberType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useCompany } from "@/contexts/CompanyContext";
import { Badge } from "@/components/ui/badge";

interface SeasonsApiResponse {
  seasons: Season[];
  suggestedNext: { name: string; startYear: number; endYear: number } | null;
}

export default function MemberFeePayments() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payingPayment, setPayingPayment] = useState<MemberFeePayment | null>(null);
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const { toast } = useToast();
  const { currentCompanyId } = useCompany();

  const { data: seasonsData } = useQuery<SeasonsApiResponse>({
    queryKey: ["/api/seasons", currentCompanyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/seasons?companyId=${currentCompanyId}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });
  const seasons = seasonsData?.seasons ?? [];

  const { data: members = [] } = useQuery<Member[]>({
    queryKey: ["/api/members", currentCompanyId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/members?companyId=${currentCompanyId}&isActive=true`);
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

  const { data: payments = [], isLoading } = useQuery<MemberFeePayment[]>({
    queryKey: ["/api/member-fee-payments", currentCompanyId, selectedSeasonId, filterPaid],
    queryFn: async () => {
      const params = new URLSearchParams({ companyId: currentCompanyId! });
      if (selectedSeasonId !== "all") params.append("seasonId", selectedSeasonId);
      if (filterPaid !== "all") params.append("isPaid", filterPaid);
      const res = await apiRequest("GET", `/api/member-fee-payments?${params}`);
      return res.json();
    },
    enabled: !!currentCompanyId,
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: async (seasonId: string) => {
      const res = await apiRequest("POST", "/api/member-fee-payments/bulk-generate", { seasonId, companyId: currentCompanyId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-fee-payments"] });
      toast({ title: `Se generaron ${data.generated} cuotas pendientes.` });
    },
    onError: () => toast({ title: "Error al generar cuotas.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/member-fee-payments/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-fee-payments"] });
      toast({ title: "Pago registrado correctamente." });
      setPayDialogOpen(false);
      setPayingPayment(null);
    },
    onError: () => toast({ title: "Error al registrar el pago.", variant: "destructive" }),
  });

  const getMember = (id: string) => members.find((m) => m.id === id);
  const getMemberType = (memberTypeId: string) => memberTypes.find((t) => t.id === memberTypeId);
  const getSeason = (id: string) => seasons.find((s) => s.id === id);

  const openPayDialog = (p: MemberFeePayment) => {
    setPayingPayment(p);
    setPayDate(new Date().toISOString().split("T")[0]);
    setPayAmount(p.amount);
    setPayNotes(p.notes ?? "");
    setPayDialogOpen(true);
  };

  const handleMarkPaid = () => {
    if (!payingPayment) return;
    updateMutation.mutate({
      id: payingPayment.id,
      data: { isPaid: true, paidDate: payDate, amount: payAmount, notes: payNotes },
    });
  };

  const handleMarkUnpaid = (p: MemberFeePayment) => {
    if (!window.confirm("¿Marcar esta cuota como pendiente?")) return;
    updateMutation.mutate({ id: p.id, data: { isPaid: false, paidDate: null } });
  };

  const paidCount = payments.filter((p) => p.isPaid).length;
  const pendingCount = payments.filter((p) => !p.isPaid).length;
  const totalCollected = payments.filter((p) => p.isPaid).reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Cuotas de Socios"
          subtitle="Control de pagos de cuotas por temporada"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <div className="p-4 lg:p-8 space-y-4">

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pagadas</p>
                <p className="text-2xl font-bold text-foreground">{paidCount}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Circle className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Euro className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recaudado</p>
                <p className="text-2xl font-bold text-foreground">{totalCollected.toFixed(2)} €</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
              <SelectTrigger className="w-full sm:w-56" id="select-season">
                <SelectValue placeholder="Todas las temporadas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las temporadas</SelectItem>
                {seasons.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPaid} onValueChange={setFilterPaid}>
              <SelectTrigger className="w-full sm:w-40" id="select-filter-paid">
                <SelectValue placeholder="Estado pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Pagadas</SelectItem>
                <SelectItem value="false">Pendientes</SelectItem>
              </SelectContent>
            </Select>
            {selectedSeasonId !== "all" && (
              <Button
                variant="outline"
                onClick={() => bulkGenerateMutation.mutate(selectedSeasonId)}
                disabled={bulkGenerateMutation.isPending}
                id="btn-bulk-generate"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${bulkGenerateMutation.isPending ? "animate-spin" : ""}`} />
                Generar cuotas pendientes
              </Button>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Cuotas</h3>
                <p className="text-sm text-muted-foreground">{payments.length} registros</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hay cuotas registradas</p>
                {selectedSeasonId !== "all" ? (
                  <p className="text-sm mt-1">Usa "Generar cuotas pendientes" para crearlas automáticamente.</p>
                ) : (
                  <p className="text-sm mt-1">Selecciona una temporada y genera las cuotas.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Socio</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Tipo</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Temporada</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Importe</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">F. Pago</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const member = getMember(p.memberId);
                      const memberType = member ? getMemberType(member.memberTypeId) : null;
                      const season = getSeason(p.seasonId);
                      return (
                        <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            {member ? (
                              <div>
                                <p className="font-medium text-foreground">{member.firstName} {member.lastName}</p>
                                <p className="text-xs text-muted-foreground font-mono">#{member.memberNumber}</p>
                              </div>
                            ) : <span className="text-muted-foreground text-sm">—</span>}
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <Badge variant="outline">{memberType?.name ?? "—"}</Badge>
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell text-sm text-foreground">
                            {season?.name ?? "—"}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-foreground">
                            {parseFloat(p.amount).toFixed(2)} €
                          </td>
                          <td className="py-3 px-4 text-center">
                            {p.isPaid ? (
                              <Badge className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                                <CheckCircle className="w-3 h-3" /> Pagada
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-orange-600">
                                <Circle className="w-3 h-3" /> Pendiente
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground">
                            {p.paidDate ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(p.paidDate).toLocaleDateString("es-ES")}
                              </div>
                            ) : "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.isPaid ? (
                              <Button variant="ghost" size="sm" onClick={() => handleMarkUnpaid(p)}
                                id={`btn-unpay-${p.id}`} className="text-muted-foreground text-xs">
                                Desmarcar
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => openPayDialog(p)} id={`btn-pay-${p.id}`}>
                                <CheckCircle className="w-3 h-3 mr-1" /> Marcar pagada
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Pay dialog */}
      <Dialog open={payDialogOpen} onOpenChange={(open) => !open && setPayDialogOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar pago de cuota</DialogTitle>
          </DialogHeader>
          {payingPayment && (() => {
            const member = getMember(payingPayment.memberId);
            return (
              <div className="space-y-4 mt-2">
                {member && (
                  <p className="text-sm text-muted-foreground">
                    Socio: <span className="font-medium text-foreground">{member.firstName} {member.lastName}</span>
                  </p>
                )}
                <div className="space-y-2">
                  <Label htmlFor="pay-date">Fecha de pago *</Label>
                  <Input id="pay-date" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Importe (€) *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="pay-amount" type="number" step="0.01" min="0" className="pl-9"
                      value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-notes">Notas</Label>
                  <Textarea id="pay-notes" rows={2} placeholder="Observaciones opcionales..."
                    value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setPayDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleMarkPaid} disabled={updateMutation.isPending}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Confirmar pago
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
