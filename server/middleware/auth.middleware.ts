/**
 * auth.middleware.ts — Middlewares centralizados de autenticación y permisos
 *
 * - isAuthenticated: re-exporta el de localAuth (passport-based)
 * - isAdmin: verifica isAdmin en la BD
 * - checkCompanyPermission: verifica acceso del usuario a una empresa concreta
 * - getCompanyIdWithPermission: helper que extrae companyId y valida permisos
 */
export { isAuthenticated } from '../localAuth';
import { storage } from '../storage';

// Middleware: verifica que el usuario es admin global
export function isAdmin(req: any, res: any, next: any) {
  const userId = (req.user as any)?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  storage.getUser(userId).then(user => {
    if (!user?.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
    next();
  }).catch(() => {
    res.status(500).json({ message: 'Internal server error' });
  });
}

// Comprueba si el usuario tiene acceso a una empresa concreta
export async function checkCompanyPermission(
  req: any,
  companyId: string,
  requiredRole?: 'administracion'
): Promise<boolean> {
  const userId = (req.user as any)?.id;
  if (!userId) return false;

  const user = await storage.getUser(userId);

  // Los admins globales tienen acceso total
  if (user?.isAdmin) return true;

  const permission = await storage.getUserPermissionForCompany(userId, companyId);
  if (!permission) return false;

  if (requiredRole && permission.role !== requiredRole) return false;

  return true;
}

// Helper: extrae companyId de la request y valida permisos
export async function getCompanyIdWithPermission(
  req: any,
  requiredRole?: 'administracion'
): Promise<{ companyId: string; hasPermission: boolean }> {
  const companyId = (req.query.companyId || req.body?.companyId) as string;
  if (!companyId) return { companyId: '', hasPermission: false };
  const hasPermission = await checkCompanyPermission(req, companyId, requiredRole);
  return { companyId, hasPermission };
}
