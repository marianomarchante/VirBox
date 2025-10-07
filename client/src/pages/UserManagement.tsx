import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useAuthContext } from '@/contexts/AuthContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileMenu from '@/components/layout/MobileMenu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Building2 } from 'lucide-react';
import type { User } from '@/hooks/use-auth';
import type { Company, UserCompanyPermission } from '@shared/schema';

interface UserWithPermissions extends User {
  permissions?: UserCompanyPermission[];
}

export default function UserManagement() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithPermissions[]>({
    queryKey: ['/api/admin/users'],
  });

  const { data: companies = [], isLoading: companiesLoading } = useQuery<Company[]>({
    queryKey: ['/api/companies'],
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      await apiRequest('PUT', `/api/admin/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'Éxito',
        description: 'Estado de administrador actualizado correctamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de administrador',
        variant: 'destructive',
      });
    },
  });

  const setPermissionMutation = useMutation({
    mutationFn: async ({ userId, companyId, role }: { userId: string; companyId: string; role: 'consulta' | 'administracion' }) => {
      await apiRequest('POST', '/api/admin/permissions', {
        userId,
        companyId,
        role,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'permissions'] });
      toast({
        title: 'Éxito',
        description: 'Permiso asignado correctamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo asignar el permiso',
        variant: 'destructive',
      });
    },
  });

  const deletePermissionMutation = useMutation({
    mutationFn: async ({ userId, companyId }: { userId: string; companyId: string }) => {
      await apiRequest('DELETE', `/api/admin/permissions/${userId}/${companyId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users', variables.userId, 'permissions'] });
      toast({
        title: 'Éxito',
        description: 'Permiso eliminado correctamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el permiso',
        variant: 'destructive',
      });
    },
  });

  const { data: companyUsers = [] } = useQuery<UserWithPermissions[]>({
    queryKey: ['/api/admin/companies', selectedUserId, 'users'],
    enabled: !!selectedUserId,
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
            <CardDescription>
              Esta página solo está disponible para administradores del sistema.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          title="Gestión de Usuarios" 
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
                <Shield className="h-8 w-8" />
                Gestión de Usuarios y Permisos
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card data-testid="card-users-list">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Usuarios del Sistema
                  </CardTitle>
                  <CardDescription>
                    Gestiona los usuarios y sus permisos de administrador global
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <p className="text-muted-foreground">Cargando usuarios...</p>
                  ) : users.length === 0 ? (
                    <p className="text-muted-foreground">No hay usuarios registrados</p>
                  ) : (
                    <div className="space-y-4">
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`user-item-${u.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {u.profilePicUrl && (
                              <img
                                src={u.profilePicUrl}
                                alt={u.name || u.email || 'Usuario'}
                                className="h-10 w-10 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-medium" data-testid={`text-user-name-${u.id}`}>
                                {u.name || u.email || 'Usuario sin nombre'}
                              </p>
                              {u.email && <p className="text-sm text-muted-foreground">{u.email}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label htmlFor={`admin-${u.id}`} className="text-sm font-medium">
                                Admin
                              </label>
                              <Switch
                                id={`admin-${u.id}`}
                                checked={u.isAdmin}
                                onCheckedChange={(checked) => {
                                  if (u.id !== user.id) {
                                    updateAdminMutation.mutate({ userId: u.id, isAdmin: checked });
                                  } else {
                                    toast({
                                      title: 'Advertencia',
                                      description: 'No puedes modificar tu propio estado de administrador',
                                      variant: 'destructive',
                                    });
                                  }
                                }}
                                disabled={u.id === user.id}
                                data-testid={`switch-admin-${u.id}`}
                              />
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedUserId(u.id)}
                              data-testid={`button-manage-permissions-${u.id}`}
                            >
                              Gestionar Permisos
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="card-permissions-manager">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Permisos por Empresa
                  </CardTitle>
                  <CardDescription>
                    Asigna permisos de consulta o administración a usuarios por empresa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedUserId ? (
                    <p className="text-muted-foreground text-center py-8">
                      Selecciona un usuario para gestionar sus permisos
                    </p>
                  ) : (
                    <PermissionsManager
                      userId={selectedUserId}
                      users={users}
                      companies={companies}
                      companiesLoading={companiesLoading}
                      onSetPermission={setPermissionMutation.mutate}
                      onDeletePermission={deletePermissionMutation.mutate}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface PermissionsManagerProps {
  userId: string;
  users: UserWithPermissions[];
  companies: Company[];
  companiesLoading: boolean;
  onSetPermission: (data: { userId: string; companyId: string; role: 'consulta' | 'administracion' }) => void;
  onDeletePermission: (data: { userId: string; companyId: string }) => void;
}

function PermissionsManager({
  userId,
  users,
  companies,
  companiesLoading,
  onSetPermission,
  onDeletePermission,
}: PermissionsManagerProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'consulta' | 'administracion'>('consulta');

  const selectedUser = users.find((u) => u.id === userId);

  const { data: userPermissions = [] } = useQuery<UserCompanyPermission[]>({
    queryKey: ['/api/admin/users', userId, 'permissions'],
    enabled: !!userId,
  });

  const handleAssignPermission = () => {
    if (selectedCompanyId && selectedRole) {
      onSetPermission({ userId, companyId: selectedCompanyId, role: selectedRole });
      setSelectedCompanyId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <p className="font-medium" data-testid="text-selected-user">
          Usuario seleccionado: {selectedUser?.name || selectedUser?.email}
        </p>
        {selectedUser?.isAdmin && (
          <Badge variant="secondary" className="mt-2">
            Administrador Global
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Asignar nuevo permiso</h3>
        <div className="flex gap-2">
          <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
            <SelectTrigger className="flex-1" data-testid="select-company">
              <SelectValue placeholder="Seleccionar empresa" />
            </SelectTrigger>
            <SelectContent>
              {companiesLoading ? (
                <div className="p-2 text-sm text-muted-foreground">Cargando empresas...</div>
              ) : (
                companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'consulta' | 'administracion')}>
            <SelectTrigger className="w-48" data-testid="select-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consulta">Consulta (Lectura)</SelectItem>
              <SelectItem value="administracion">Administración (Lectura/Escritura)</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleAssignPermission}
            disabled={!selectedCompanyId}
            data-testid="button-assign-permission"
          >
            Asignar
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Permisos actuales</h3>
        {userPermissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Este usuario no tiene permisos asignados</p>
        ) : (
          <div className="space-y-2">
            {userPermissions.map((permission) => {
              const company = companies.find((c) => c.id === permission.companyId);
              return (
                <div
                  key={`${permission.userId}-${permission.companyId}`}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`permission-item-${permission.companyId}`}
                >
                  <div>
                    <p className="font-medium">{company?.name || permission.companyId}</p>
                    <Badge variant={permission.role === 'administracion' ? 'default' : 'secondary'}>
                      {permission.role === 'administracion' ? 'Administración' : 'Consulta'}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeletePermission({ userId: permission.userId, companyId: permission.companyId })}
                    data-testid={`button-delete-permission-${permission.companyId}`}
                  >
                    Eliminar
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
