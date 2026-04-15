import { useState } from "react";
import { Plus, Mail, Phone, MapPin, Eye, Edit, Trash2, AlertTriangle, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useClients } from "@/hooks/use-clients";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { insertClientSchema, type InsertClient } from "@shared/schema";
import { DataTable } from "@/components/common/DataTable";

export default function Clients() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

  const { clients, createClient, updateClient, deleteClient, isLoading } = useClients();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: '',
      clientType: 'particular',
      idFiscal: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      codigoOficinaContable: '',
      codigoOrganoGestor: '',
      codigoUnidadTramitadora: '',
      isActive: true,
    },
  });

  const watchClientType = form.watch('clientType');
  const isAdminPublica = watchClientType === 'administracion_publica';

  const handleSubmit = (data: InsertClient) => {
    const errors: string[] = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Nombre del cliente');
    }

    const dir3Regex = /^[A-Z0-9]{9}$/;
    if (data.clientType === 'administracion_publica') {
      if (!data.codigoOficinaContable || !dir3Regex.test(data.codigoOficinaContable)) {
        errors.push('Código Oficina Contable (9 caracteres alfanuméricos en mayúsculas)');
      }
      if (!data.codigoOrganoGestor || !dir3Regex.test(data.codigoOrganoGestor)) {
        errors.push('Código Órgano Gestor (9 caracteres alfanuméricos en mayúsculas)');
      }
      if (!data.codigoUnidadTramitadora || !dir3Regex.test(data.codigoUnidadTramitadora)) {
        errors.push('Código Unidad Tramitadora (9 caracteres alfanuméricos en mayúsculas)');
      }
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationModalOpen(true);
      return;
    }

    const submitData = { ...data };
    if (data.clientType !== 'administracion_publica') {
      submitData.codigoOficinaContable = null;
      submitData.codigoOrganoGestor = null;
      submitData.codigoUnidadTramitadora = null;
    }
    
    if (editingClient) {
      updateClient.mutate({ id: editingClient, client: { ...submitData, companyId: currentCompanyId ?? undefined } });
    } else {
      createClient.mutate({ ...submitData, companyId: currentCompanyId ?? undefined });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    form.reset();
  };

  const handleEdit = (clientId: string) => {
    const client = clients?.find(c => c.id === clientId);
    if (client) {
      setEditingClient(clientId);
      form.reset({
        name: client.name,
        clientType: (client as any).clientType || 'particular',
        idFiscal: client.idFiscal || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        contactPerson: client.contactPerson || '',
        codigoOficinaContable: (client as any).codigoOficinaContable || '',
        codigoOrganoGestor: (client as any).codigoOrganoGestor || '',
        codigoUnidadTramitadora: (client as any).codigoUnidadTramitadora || '',
        isActive: client.isActive,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (clientId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      deleteClient.mutate(clientId);
    }
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
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
            <p className="text-muted-foreground">Cargando clientes...</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 overflow-y-auto">
          <TopBar
            title="Clientes"
            subtitle="Gestión de clientes y compradores"
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Lista de Clientes</h3>
                <p className="text-sm text-muted-foreground">
                  {clients?.length || 0} clientes registrados
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                data-testid="button-add-client"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Cliente
              </Button>
            </div>
            <DataTable<any>
              data={clients}
              isLoading={isLoading}
              testId="clients-table"
              columns={[
                {
                  header: "Cliente",
                  accessor: (client) => (
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      {client.contactPerson && (
                        <p className="text-xs text-muted-foreground">
                          {client.contactPerson}
                        </p>
                      )}
                    </div>
                  )
                },
                {
                  header: "Tipo",
                  accessor: (client) => (
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                      client.clientType === 'administracion_publica'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {({ particular: 'Particular', empresa: 'Empresa', autonomo: 'Autónomo', administracion_publica: 'Admin. Pública' } as Record<string, string>)[client.clientType || 'particular'] || 'Particular'}
                    </span>
                  )
                },
                {
                  header: "ID Fiscal",
                  accessor: (client) => (
                    client.idFiscal ? (
                      <span className="text-sm font-mono text-muted-foreground">
                        {client.idFiscal}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Sin ID fiscal
                      </span>
                    )
                  )
                },
                {
                  header: "Total Compras",
                  align: "right",
                  accessor: (client) => (
                    <span className="text-sm font-semibold text-primary">
                      {formatCurrency(client.totalPurchases || "0")}
                    </span>
                  )
                },
                {
                  header: "Pedidos",
                  align: "right",
                  accessor: "orderCount"
                },
                {
                  header: "Estado",
                  align: "center",
                  accessor: (client) => (
                    <span 
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        client.isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {client.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  )
                }
              ]}
              canWrite={canWrite}
              onEdit={(client) => handleEdit(client.id)}
              onDelete={(client) => handleDelete(client.id)}
              onView={(client) => { /* TODO: implement view */ }}
              emptyMessage={!canWrite ? "No hay clientes registrados." : undefined}
            />
            </div>
          </div>
        </main>
      )}

      {/* Add/Edit Client Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Editar Cliente' : 'Agregar Cliente'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="client-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nombre de la empresa *</Label>
                <Input
                  {...form.register("name")}
                  placeholder="Ej: Mercado Central S.A."
                  data-testid="input-client-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="clientType">Tipo de cliente</Label>
                <Select
                  value={watchClientType || 'particular'}
                  onValueChange={(value) => form.setValue('clientType', value)}
                  data-testid="select-client-type"
                >
                  <SelectTrigger data-testid="select-trigger-client-type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="autonomo">Autónomo</SelectItem>
                    <SelectItem value="administracion_publica">Administración Pública</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="idFiscal">ID Fiscal (NIF/CIF)</Label>
                <Input
                  {...form.register("idFiscal")}
                  placeholder="Ej: A12345678"
                  maxLength={10}
                  data-testid="input-client-id-fiscal"
                />
              </div>
              
              <div>
                <Label htmlFor="contactPerson">Persona de contacto</Label>
                <Input
                  {...form.register("contactPerson")}
                  placeholder="Nombre del contacto"
                  data-testid="input-contact-person"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  type="email"
                  {...form.register("email")}
                  placeholder="contacto@empresa.com"
                  data-testid="input-client-email"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  {...form.register("phone")}
                  placeholder="+1 234 567 8900"
                  data-testid="input-client-phone"
                />
              </div>
              
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  {...form.register("address")}
                  placeholder="Dirección completa"
                  data-testid="input-client-address"
                />
              </div>
            </div>

            {isAdminPublica && (
              <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/30">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-400">Códigos DIR3 (Obligatorios para Administración Pública)</h4>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Conforme a la Ley 25/2013. Cada código debe tener exactamente 9 caracteres alfanuméricos en mayúsculas (A-Z, 0-9).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="codigoOficinaContable">Oficina Contable *</Label>
                    <Input
                      {...form.register("codigoOficinaContable")}
                      placeholder="Ej: L01280796"
                      maxLength={9}
                      className="font-mono uppercase"
                      onChange={(e) => form.setValue('codigoOficinaContable', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      data-testid="input-codigo-oficina-contable"
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigoOrganoGestor">Órgano Gestor *</Label>
                    <Input
                      {...form.register("codigoOrganoGestor")}
                      placeholder="Ej: L01280796"
                      maxLength={9}
                      className="font-mono uppercase"
                      onChange={(e) => form.setValue('codigoOrganoGestor', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      data-testid="input-codigo-organo-gestor"
                    />
                  </div>
                  <div>
                    <Label htmlFor="codigoUnidadTramitadora">Unidad Tramitadora *</Label>
                    <Input
                      {...form.register("codigoUnidadTramitadora")}
                      placeholder="Ej: L01280796"
                      maxLength={9}
                      className="font-mono uppercase"
                      onChange={(e) => form.setValue('codigoUnidadTramitadora', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      data-testid="input-codigo-unidad-tramitadora"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 pt-6 border-t border-border">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createClient.isPending || updateClient.isPending}
                data-testid="button-save-client"
              >
                {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                data-testid="button-cancel-client"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={validationModalOpen} onOpenChange={setValidationModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Datos obligatorios incompletos
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Para guardar es necesario completar los siguientes campos:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm font-medium text-destructive">
                  {error}
                </li>
              ))}
            </ul>
            <div className="flex justify-end">
              <Button onClick={() => setValidationModalOpen(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
