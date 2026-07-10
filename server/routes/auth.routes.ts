import type { Express } from 'express';
import { storage } from '../storage';
import { isAuthenticated } from '../middleware/auth.middleware';

export function registerAuthRoutes(app: Express) {
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      const { passwordHash, ...safeUser } = user as any;
      res.json(safeUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  app.get('/api/auth/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      res.status(500).json({ message: 'Failed to fetch permissions' });
    }
  });

  app.get('/api/auth/permissions/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      const companyId = req.params.companyId;

      const user = await storage.getUser(userId);
      if (user?.isAdmin) {
        return res.json([{
          id: 'admin-access',
          userId,
          companyId,
          role: 'administracion',
          createdAt: new Date(),
        }]);
      }

      const permission = await storage.getUserPermissionForCompany(userId, companyId);
      res.json(permission ? [permission] : []);
    } catch (error) {
      console.error('Error fetching company permission:', error);
      res.status(500).json({ message: 'Failed to fetch company permission' });
    }
  });
}
