import { useState, useRef } from "react";
import { Plus, Building2, Mail, Phone, MapPin, Edit, Trash2, Upload, X, Globe, CreditCard, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/layout/Sidebar";
import MobileMenu from "@/components/layout/MobileMenu";
import TopBar from "@/components/layout/TopBar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, type InsertCompany, type Company } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function Companies() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: companies, isLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const createCompany = useMutation({
    mutationFn: async (company: InsertCompany) => {
      const response = await apiRequest('POST', '/api/companies', company);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: "Empresa creada",
        description: "La empresa se ha registrado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la empresa.",
        variant: "destructive",
      });
    },
  });

  const updateCompany = useMutation({
    mutationFn: async ({ id, company }: { id: string; company: Partial<InsertCompany> }) => {
      const response = await apiRequest('PUT', `/api/companies/${id}`, company);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: "Empresa actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la empresa.",
        variant: "destructive",
      });
    },
  });

  const deleteCompany = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      toast({
        title: "Empresa eliminada",
        description: "La empresa se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la empresa.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertCompany>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: '',
      taxId: null,
      address: null,
      phone: null,
      email: null,
      bankAccount: null,
      website: null,
      canIssueAgriculturalReceipts: false,
      isActive: true,
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Por favor seleccione un archivo de imagen válido.",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no puede superar 2MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoImage(event.target?.result as string);
        setLogoFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoImage(null);
    setLogoFileName(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handleSubmit = (data: InsertCompany) => {
    const companyData = {
      ...data,
      logoImage: logoImage,
      logoFileName: logoFileName,
    };
    if (editingCompany) {
      updateCompany.mutate({ id: editingCompany, company: companyData });
    } else {
      createCompany.mutate(companyData);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setLogoImage(null);
    setLogoFileName(null);
    form.reset();
  };

  const handleEdit = (companyId: string) => {
    const company = companies?.find(c => c.id === companyId);
    if (company) {
      setEditingCompany(companyId);
      setLogoImage(company.logoImage || null);
      setLogoFileName(company.logoFileName || null);
      form.reset({
        name: company.name,
        taxId: company.taxId || null,
        address: company.address || null,
        phone: company.phone || null,
        email: company.email || null,
        bankAccount: company.bankAccount || null,
        website: company.website || null,
        canIssueAgriculturalReceipts: company.canIssueAgriculturalReceipts || false,
        isActive: company.isActive,
      });
      setIsModalOpen(true);
    }
  };

  const handleDelete = (companyId: string) => {
    const company = companies?.find(c => c.id === companyId);
    if (window.confirm(`¿Está seguro de que desea eliminar la empresa "${company?.name}"? Esta acción también eliminará todos los datos asociados a esta empresa.`)) {
      deleteCompany.mutate(companyId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        <TopBar
          title="Empresas"
          subtitle="Gestión de empresas y organización multi-compañía"
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        
        <div className="p-4 lg:p-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Lista de Empresas</h3>
                <p className="text-sm text-muted-foreground">
                  {companies?.length || 0} empresas registradas
                </p>
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                data-testid="button-add-company"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Empresa
              </Button>
            </div>
            
            <div className="overflow-x-auto" data-testid="companies-table">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Empresa
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      NIF/CIF
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Contacto
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase">
                      Ubicación
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
                  {!companies || companies.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No hay empresas registradas. 
                        <button 
                          onClick={() => setIsModalOpen(true)}
                          className="text-primary hover:underline ml-1"
                        >
                          Agregar la primera
                        </button>
                      </td>
                    </tr>
                  ) : (
                    companies.map((company) => (
                      <tr 
                        key={company.id} 
                        className="transaction-row"
                        data-testid={`company-row-${company.id}`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">{company.name}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-muted-foreground">
                            {company.taxId || '-'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {company.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs">{company.email}</span>
                              </div>
                            )}
                            {company.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs">{company.phone}</span>
                              </div>
                            )}
                            {!company.email && !company.phone && (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {company.address ? (
                            <div className="flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground mt-0.5" />
                              <span className="text-xs">{company.address}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {company.isActive ? (
                            <Badge className="bg-success/10 text-success hover:bg-success/20">
                              Activa
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inactiva
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(company.id)}
                              data-testid={`button-edit-${company.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(company.id)}
                              data-testid={`button-delete-${company.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
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

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Nombre de la Empresa *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Mi Empresa"
                  data-testid="input-company-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="taxId">NIF / CIF</Label>
                <Input
                  id="taxId"
                  {...form.register('taxId')}
                  placeholder="A12345678"
                  data-testid="input-tax-id"
                />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+593 99 123 4567"
                  data-testid="input-phone"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="contacto@miempresa.com"
                  data-testid="input-email"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="Av. Principal 123, Ciudad"
                  data-testid="input-address"
                />
              </div>

              <div>
                <Label htmlFor="bankAccount">Cuenta Bancaria (máx. 24 car.)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="bankAccount"
                    {...form.register('bankAccount')}
                    placeholder="ES12 3456 7890 1234"
                    maxLength={24}
                    className="pl-10"
                    data-testid="input-bank-account"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">Página Web (máx. 155 car.)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="website"
                    {...form.register('website')}
                    placeholder="www.miempresa.com"
                    maxLength={155}
                    className="pl-10"
                    data-testid="input-website"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                <Checkbox
                  id="canIssueAgriculturalReceipts"
                  checked={form.watch("canIssueAgriculturalReceipts") || false}
                  onCheckedChange={(checked) => form.setValue("canIssueAgriculturalReceipts", checked === true)}
                  data-testid="checkbox-can-issue-agricultural-receipts"
                />
                <div className="flex items-center gap-2">
                  <Wheat className="w-4 h-4 text-green-600" />
                  <Label htmlFor="canIssueAgriculturalReceipts" className="cursor-pointer">
                    Puede expedir Recibos Agrarios (REAGP)
                  </Label>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Logotipo de la Empresa</Label>
                <div className="mt-2">
                  {logoImage ? (
                    <div className="flex items-center gap-4">
                      <img 
                        src={logoImage} 
                        alt="Logo de la empresa" 
                        className="w-24 h-24 object-contain border rounded-lg bg-white"
                      />
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">{logoFileName}</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={handleRemoveLogo}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => logoInputRef.current?.click()}
                    >
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Haga clic para subir una imagen
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG hasta 2MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    data-testid="input-logo"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  {...form.register('isActive')}
                  className="h-4 w-4"
                  data-testid="input-is-active"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Empresa activa
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseModal}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                data-testid="button-save"
              >
                {editingCompany ? 'Guardar Cambios' : 'Crear Empresa'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
