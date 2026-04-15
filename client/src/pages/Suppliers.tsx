import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Mail, Phone, MapPin, Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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
import { DataTable } from "@/components/common/DataTable";
import { EntityForm } from "@/components/common/EntityForm";

export default function Suppliers() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationModalOpen, setValidationModalOpen] = useState(false);

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
      town: '',
      province: '',
      postalCode: '',
      contactPerson: '',
      category: 'materials',
      isActive: true,
      isReagp: false,
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
    const errors: string[] = [];
    
    if (!data.name || data.name.trim() === '') {
      errors.push('Nombre del proveedor');
    }
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setValidationModalOpen(true);
      return;
    }
    
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
        town: supplier.town || '',
        province: supplier.province || '',
        postalCode: supplier.postalCode || '',
        contactPerson: supplier.contactPerson || '',
        category: supplier.category,
        isActive: supplier.isActive,
        isReagp: supplier.isReagp || false,
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
                     <DataTable<any>
              data={suppliers}
              isLoading={isLoading}
              testId="suppliers-table"
              columns={[
                {
                  header: "Proveedor",
                  accessor: (supplier) => (
                    <div>
                      <p className="text-sm font-medium">{supplier.name}</p>
                      {supplier.contactPerson && (
                        <p className="text-xs text-muted-foreground">
                          {supplier.contactPerson}
                        </p>
                      )}
                    </div>
                  )
                },
                {
                  header: "ID Fiscal",
                  accessor: (supplier) => (
                    supplier.idFiscal ? (
                      <span className="text-sm font-mono text-muted-foreground">
                        {supplier.idFiscal}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Sin ID fiscal
                      </span>
                    )
                  )
                },
                {
                  header: "Categoría",
                  accessor: (supplier) => {
                    const label = getCategoryLabel(supplier.category);
                    const colorClass = getCategoryColor(supplier.category);
                    const colorMap: Record<string, string> = {
                      primary: 'bg-primary/10 text-primary',
                      destructive: 'bg-destructive/10 text-destructive',
                      muted: 'bg-muted/10 text-muted-foreground',
                      accent: 'bg-accent/10 text-accent',
                      secondary: 'bg-secondary/10 text-secondary'
                    };
                    return (
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${colorMap[colorClass] || colorMap.muted}`}>
                        {label}
                      </span>
                    );
                  }
                },
                {
                  header: "Total Compras",
                  align: "right",
                  accessor: (supplier) => (
                    <span className="text-sm font-semibold text-destructive">
                      {formatCurrency(supplier.totalPurchases || "0")}
                    </span>
                  )
                },
                {
                  header: "Órdenes",
                  align: "right",
                  accessor: "orderCount"
                },
                {
                  header: "Estado",
                  align: "center",
                  accessor: (supplier) => (
                    <span 
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        supplier.isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {supplier.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  )
                }
              ]}
              canWrite={canWrite}
              onEdit={(supplier) => handleEdit(supplier.id)}
              onDelete={(supplier) => handleDelete(supplier.id)}
              onView={(supplier) => { /* TODO: implement view */ }}
            />
            </div>
          </div>
        </main>

      {/* Add/Edit Supplier Modal */}
      <EntityForm<InsertSupplier>
        title={editingSupplier ? 'Editar Proveedor' : 'Agregar Proveedor'}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        schema={insertSupplierSchema}
        isLoading={createSupplier.isPending || updateSupplier.isPending}
        testId="supplier-form"
        defaultValues={editingSupplier ? suppliers?.find(s => s.id === editingSupplier) as any : {
          name: '',
          idFiscal: '',
          email: '',
          phone: '',
          address: '',
          town: '',
          province: '',
          postalCode: '',
          contactPerson: '',
          category: 'materials',
          isActive: true,
          isReagp: false,
        }}
      >
        {(form) => (
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
            
            <div>
              <Label htmlFor="town">Población</Label>
              <Input
                {...form.register("town")}
                placeholder="Ej: Madrid"
                data-testid="input-supplier-town"
              />
            </div>
            
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input
                {...form.register("province")}
                placeholder="Ej: Madrid"
                data-testid="input-supplier-province"
              />
            </div>
            
            <div>
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                {...form.register("postalCode")}
                placeholder="Ej: 28001"
                maxLength={5}
                data-testid="input-supplier-postal-code"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="isReagp"
                checked={form.watch("isReagp") || false}
                onCheckedChange={(checked) => form.setValue("isReagp", checked === true)}
                data-testid="checkbox-supplier-reagp"
              />
              <Label htmlFor="isReagp" className="cursor-pointer">
                Proveedor REAGP (Régimen Especial de Agricultura, Ganadería y Pesca)
              </Label>
            </div>
          </div>
        )}
      </EntityForm>

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
