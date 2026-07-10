import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission } from '../middleware/auth.middleware';
import { insertEventSchema } from '@shared/schema';

export function registerEventRoutes(app: Express) {
  app.get('/api/events', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const events = await storage.getEvents(companyId);
    res.json(events);
  });

  app.get('/api/events/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const event = await storage.getEvent(req.params.id, companyId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  });

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({ ...validatedData, companyId });
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid event data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/events/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, companyId, validatedData);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid event data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch('/api/events/:id/read', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const event = await storage.updateEvent(req.params.id, companyId, { isRead: true } as any);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  });

  app.delete('/api/events/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteEvent(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Event not found' });
    res.status(204).send();
  });
}
