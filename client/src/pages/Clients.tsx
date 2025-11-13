import { useState } from "react";
import { Plus, Mail, Phone, MapPin, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export default function Clients() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<string | null>(null);

  const { clients, createClient, updateClient, deleteClient, isLoading } = useClients();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: '',
      idFiscal: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      isActive: true,
    },
  });

  const handleSubmit = (data: InsertClient) => {
    if (editingClient) {
      updateClient.mutate({ id: editingClient, client: { ...data, companyId: currentCompanyId ?? undefined } });
    } else {
      createClient.mutate({ ...data, companyId: currentCompanyId ?? undefined });
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
        idFiscal: client.idFiscal || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        contactPerson: client.contactPerson || '',
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
            
            <div className="overflow-x-auto" data-testid="clients-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Cliente
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Contacto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Ubicación
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Total Compras
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Pedidos
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
                  {!clients || clients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No hay clientes registrados. 
                        {canWrite && (
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
                    clients.map((client) => (
                      <tr 
                        key={client.id} 
                        className="transaction-row"
                        data-testid={`client-row-${client.id}`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-sm font-medium">{client.name}</p>
                            {client.contactPerson && (
                              <p className="text-xs text-muted-foreground">
                                Contacto: {client.contactPerson}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {client.email && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {client.address && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate max-w-32">{client.address}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-semibold text-primary">
                            {formatCurrency(client.totalPurchases || "0")}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-sm font-medium">
                            {client.orderCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span 
                            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                              client.isActive 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {client.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              data-testid={`view-client-${client.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleEdit(client.id)}
                              data-testid={`edit-client-${client.id}`}
                              disabled={!canWrite}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleDelete(client.id)}
                              data-testid={`delete-client-${client.id}`}
                              disabled={!canWrite}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
}
