import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Mail, Phone, MapPin, Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useSuppliers } from "@/hooks/use-suppliers";
import { useCompanyPermission } from "@/hooks/use-company-permission";
import { useCompany } from "@/contexts/CompanyContext";
import NoCompanySelected from "@/components/shared/NoCompanySelected";
import { insertSupplierSchema, type InsertSupplier } from "@shared/schema";

export default function Suppliers() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);

  const { suppliers, createSupplier, updateSupplier, deleteSupplier, isLoading } = useSuppliers();
  const { canWrite, hasCompanySelected } = useCompanyPermission();
  const { currentCompanyId } = useCompany();

  const form = useForm<InsertSupplier>({
    resolver: zodResolver(insertSupplierSchema),
    defaultValues: {
      name: '',
      idFiscal: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
      category: 'materials',
      isActive: true,
    },
  });

  const categories = [
    { value: 'materials', label: 'Materiales' },
    { value: 'supplies', label: 'Suministros' },
    { value: 'equipment', label: 'Equipamiento' },
    { value: 'tools', label: 'Herramientas' },
    { value: 'technology', label: 'Tecnología' },
    { value: 'services', label: 'Servicios' },
    { value: 'other', label: 'Otros' },
  ];

  const handleSubmit = (data: InsertSupplier) => {
    if (editingSupplier) {
      updateSupplier.mutate({ id: editingSupplier, supplier: { ...data, companyId: currentCompanyId ?? undefined } });
    } else {
      createSupplier.mutate({ ...data, companyId: currentCompanyId ?? undefined });
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    form.reset();
  };

  const handleEdit = (supplierId: string) => {
    const supplier = suppliers?.find(s => s.id === supplierId);
    if (supplier) {
      setEditingSupplier(supplierId);
      form.reset({
        name: supplier.name,
        idFiscal: supplier.idFiscal || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contactPerson: supplier.contactPerson || '',
        category: supplier.category,
        isActive: supplier.isActive,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (supplierId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      deleteSupplier.mutate(supplierId);
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

  const getCategoryLabel = (category: string) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'materials': 'primary',
      'supplies': 'accent',
      'equipment': 'muted',
      'tools': 'accent',
      'technology': 'secondary',
      'services': 'primary',
    };
    return colors[category] || 'muted';
  };

  if (!hasCompanySelected) {
    return (
      <div key={`no-company-${location}`} className="flex h-screen overflow-hidden bg-background">
        <Sidebar key={`sidebar-${location}`} />
        <MobileMenu key={`mobile-${location}`} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
        <div className="flex-1 flex items-center justify-center">
          <NoCompanySelected />
        </div>
      </div>
    );
  }

  return (
    <div key={`suppliers-${location}`} className="flex h-screen overflow-hidden bg-background">
      <Sidebar key={`sidebar-${location}`} />
      <MobileMenu key={`mobile-${location}`} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Proveedores"
          subtitle="Gestión de proveedores y suministros"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
          
          <div className="p-4 lg:p-8">
            <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Lista de Proveedores</h3>
                <p className="text-sm text-muted-foreground">
                  {suppliers?.length || 0} proveedores registrados
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                data-testid="button-add-supplier"
                disabled={!canWrite}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Proveedor
              </Button>
            </div>
            
            <div className="overflow-x-auto" data-testid="suppliers-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Proveedor
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Categoría
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
                      Órdenes
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
                  {!suppliers || suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No hay proveedores registrados. 
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
                    suppliers.map((supplier) => {
                      const categoryColor = getCategoryColor(supplier.category);
                      const colorMap: Record<string, { bg: string, text: string }> = {
                        primary: { bg: 'bg-primary/10', text: 'text-primary' },
                        destructive: { bg: 'bg-destructive/10', text: 'text-destructive' },
                        muted: { bg: 'bg-muted/10', text: 'text-muted-foreground' },
                        accent: { bg: 'bg-accent/10', text: 'text-accent' },
                        secondary: { bg: 'bg-secondary/10', text: 'text-secondary' }
                      };
                      const colors = colorMap[categoryColor] || colorMap.muted;
                      
                      return (
                        <tr 
                          key={supplier.id} 
                          className="transaction-row"
                          data-testid={`supplier-row-${supplier.id}`}
                        >
                          <td className="py-3 px-4">
                            <div>
                              <p className="text-sm font-medium">{supplier.name}</p>
                              {supplier.contactPerson && (
                                <p className="text-xs text-muted-foreground">
                                  Contacto: {supplier.contactPerson}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span 
                              className={`inline-block px-2 py-1 text-xs font-medium ${colors.bg} ${colors.text} rounded`}
                            >
                              {getCategoryLabel(supplier.category)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {supplier.email && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  {supplier.email}
                                </div>
                              )}
                              {supplier.phone && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  {supplier.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {supplier.address && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate max-w-32">{supplier.address}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-semibold text-destructive">
                              {formatCurrency(supplier.totalPurchases || "0")}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sm font-medium">
                              {supplier.orderCount}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span 
                              className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                supplier.isActive 
                                  ? 'bg-primary/10 text-primary' 
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {supplier.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                data-testid={`view-supplier-${supplier.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleEdit(supplier.id)}
                                data-testid={`edit-supplier-${supplier.id}`}
                                disabled={!canWrite}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleDelete(supplier.id)}
                                data-testid={`delete-supplier-${supplier.id}`}
                                disabled={!canWrite}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
        </main>

      {/* Add/Edit Supplier Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSupplier ? 'Editar Proveedor' : 'Agregar Proveedor'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" data-testid="supplier-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nombre de la empresa *</Label>
                <Input
                  {...form.register("name")}
                  placeholder="Ej: Suministros Generales S.A."
                  data-testid="input-supplier-name"
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
                  placeholder="Ej: B87654321"
                  maxLength={10}
                  data-testid="input-supplier-id-fiscal"
                />
              </div>
              
              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select 
                  value={form.watch('category')} 
                  onValueChange={(value) => form.setValue('category', value)}
                >
                  <SelectTrigger data-testid="select-supplier-category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.category.message}
                  </p>
                )}
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
                  placeholder="contacto@proveedor.com"
                  data-testid="input-supplier-email"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  {...form.register("phone")}
                  placeholder="+1 234 567 8900"
                  data-testid="input-supplier-phone"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  {...form.register("address")}
                  placeholder="Dirección completa"
                  data-testid="input-supplier-address"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 pt-6 border-t border-border">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createSupplier.isPending || updateSupplier.isPending}
                data-testid="button-save-supplier"
              >
                {editingSupplier ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                data-testid="button-cancel-supplier"
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
