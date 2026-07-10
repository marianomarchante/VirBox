import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission, checkCompanyPermission } from '../middleware/auth.middleware';
import { insertDocumentCategorySchema, insertDocumentSchema } from '@shared/schema';

export function registerDocumentRoutes(app: Express) {
  // ── Document Categories ──────────────────────────────────────────────────────────

  app.get('/api/document-categories', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const categories = await storage.getDocumentCategories(companyId);
    res.json(categories);
  });

  app.get('/api/document-categories/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const category = await storage.getDocumentCategory(req.params.id, companyId);
    if (!category) return res.status(404).json({ message: 'Document category not found' });
    res.json(category);
  });

  app.post('/api/document-categories', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertDocumentCategorySchema.parse(req.body);
      const companyId = validatedData.companyId;
      if (!companyId) return res.status(400).json({ message: 'Company ID is required' });
      const hasPermission = await checkCompanyPermission(req, companyId, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const category = await storage.createDocumentCategory({ ...validatedData, companyId });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid document category data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/document-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertDocumentCategorySchema.partial().parse(req.body);
      const category = await storage.updateDocumentCategory(req.params.id, companyId, validatedData);
      if (!category) return res.status(404).json({ message: 'Document category not found' });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid document category data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/document-categories/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteDocumentCategory(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Document category not found' });
    res.status(204).send();
  });

  // ── Documents ─────────────────────────────────────────────────────────────────────

  app.get('/api/documents', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const documents = await storage.getDocuments(companyId);
    res.json(documents);
  });

  app.get('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const document = await storage.getDocument(req.params.id, companyId);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  });

  app.post('/api/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument({ ...validatedData, companyId });
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid document data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, companyId, validatedData);
      if (!document) return res.status(404).json({ message: 'Document not found' });
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid document data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteDocument(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Document not found' });
    res.status(204).send();
  });
}
