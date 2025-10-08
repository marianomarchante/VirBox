import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import type { UserCompanyPermission } from '@shared/schema';

export function useCompanyPermission() {
  const { user } = useAuthContext();
  const { currentCompanyId } = useCompany();

  const { data: permissions = [] } = useQuery<UserCompanyPermission[]>({
    queryKey: ['/api/auth/permissions', currentCompanyId],
    enabled: !!user,
  });

  const currentPermission = permissions.find(
    (p) => p.companyId === currentCompanyId
  );

  const hasPermission = (requiredRole?: 'administracion') => {
    if (!user) return false;
    if (!currentCompanyId) return false; // No permissions without a selected company
    if (user.isAdmin) return true;
    if (!currentPermission) return false;
    if (!requiredRole) return true;
    return currentPermission.role === requiredRole;
  };

  return {
    permission: currentPermission,
    role: currentPermission?.role,
    canRead: hasPermission(),
    canWrite: hasPermission('administracion'),
    isAdmin: user?.isAdmin || false,
    hasCompanySelected: !!currentCompanyId,
  };
}
