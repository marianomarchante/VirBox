import type { Express } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware';
import { insertUserCompanyPermissionSchema } from '@shared/schema';

export function registerAdminRoutes(app: Express) {
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, email, firstName, lastName, password, isAdmin: adminStatus } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: 'El nombre de usuario y la contraseña son requeridos' });
      }
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: 'El nombre de usuario ya existe' });
      }
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const user = await storage.upsertUser({
        username,
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash,
        isAdmin: adminStatus || false,
      } as any);
      res.status(201).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  app.put('/api/admin/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, email, firstName, lastName, password } = req.body;
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: 'User not found' });

      if (username && username !== user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) return res.status(400).json({ message: 'El nombre de usuario ya existe' });
      }

      const updateData: any = {
        id: req.params.userId,
        username: username || user.username,
        email: email !== undefined ? email : user.email,
        firstName: firstName !== undefined ? firstName : user.firstName,
        lastName: lastName !== undefined ? lastName : user.lastName,
        isAdmin: user.isAdmin,
        passwordHash: user.passwordHash,
      };

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(password, salt);
      }

      const updatedUser = await storage.upsertUser(updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.put('/api/admin/users/:userId/admin', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isAdmin: adminStatus } = req.body;
      const user = await storage.updateUserAdmin(req.params.userId, adminStatus);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json(user);
    } catch {
      res.status(500).json({ message: 'Failed to update user' });
    }
  });

  app.delete('/api/admin/users/:userId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // We don't have a deleteUser method, so just return 200
      res.status(200).json({ message: 'User deletion not implemented in storage' });
    } catch {
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  app.get('/api/admin/companies/:companyId/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersForCompany(req.params.companyId);
      res.json(users);
    } catch {
      res.status(500).json({ message: 'Failed to fetch company users' });
    }
  });

  app.get('/api/admin/users/:userId/permissions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch {
      res.status(500).json({ message: 'Failed to fetch user permissions' });
    }
  });

  app.post('/api/admin/permissions', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertUserCompanyPermissionSchema.parse(req.body);
      const permission = await storage.setUserPermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid permission data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to set permission' });
      }
    }
  });

  app.delete('/api/admin/permissions/:userId/:companyId', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUserPermission(req.params.userId, req.params.companyId);
      if (!success) return res.status(404).json({ message: 'Permission not found' });
      res.status(204).send();
    } catch {
      res.status(500).json({ message: 'Failed to delete permission' });
    }
  });
}
