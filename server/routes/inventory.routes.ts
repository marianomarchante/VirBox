import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission } from '../middleware/auth.middleware';
import { insertInventorySchema } from '@shared/schema';

export function registerInventoryRoutes(app: Express) {
  app.get('/api/inventory', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const inventory = await storage.getInventory(companyId);
    res.json(inventory);
  });

  app.get('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const item = await storage.getInventoryItem(req.params.id, companyId);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(item);
  });

  app.post('/api/inventory', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem({ ...validatedData, companyId });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid inventory data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, companyId, validatedData);
      if (!item) return res.status(404).json({ message: 'Inventory item not found' });
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid inventory data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/inventory/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteInventoryItem(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Inventory item not found' });
    res.status(204).send();
  });

  // Inventory movements
  app.get('/api/inventory/:id/movements', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const movements = await storage.getInventoryMovements(companyId, req.params.id);
    res.json(movements);
  });
}
