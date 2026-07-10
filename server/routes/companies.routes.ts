import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, isAdmin, checkCompanyPermission } from '../middleware/auth.middleware';
import { insertCompanySchema } from '@shared/schema';

export function registerCompanyRoutes(app: Express) {
  app.get('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      const companies = await storage.getCompaniesForUser(userId);
      res.json(companies);
    } catch {
      res.status(500).json({ message: 'Failed to fetch companies' });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    const hasPermission = await checkCompanyPermission(req, req.params.id);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });

    const company = await storage.getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  });

  app.post('/api/companies', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid company data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.put('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    const hasPermission = await checkCompanyPermission(req, req.params.id, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, validatedData);
      if (!company) return res.status(404).json({ message: 'Company not found' });
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid company data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.delete('/api/companies/:id', isAuthenticated, isAdmin, async (req, res) => {
    const success = await storage.deleteCompany(req.params.id);
    if (!success) return res.status(404).json({ message: 'Company not found' });
    res.status(204).send();
  });
}
