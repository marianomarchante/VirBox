import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission, checkCompanyPermission } from '../middleware/auth.middleware';
import {
  insertCategorySchema,
  insertProductCategorySchema,
  transactionFilterSchema,
  insertTransactionSchema,
} from '@shared/schema';

export function registerCoreRoutes(app: Express) {
  // ── Dashboard ─────────────────────────────────────────────────────────────────

  app.get('/api/dashboard/metrics', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const metrics = await storage.getMetrics(companyId);
    res.json(metrics);
  });

  app.get('/api/dashboard/monthly-data', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const data = await storage.getMonthlyData(companyId);
    res.json(data);
  });

  // ── Transactions ──────────────────────────────────────────────────────────────

  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
      const filter = transactionFilterSchema.parse(req.query);
      const transactions = await storage.getTransactions(companyId, {
        type: filter.type === 'all' ? undefined : filter.type,
        category: filter.category || undefined,
        dateFrom: filter.dateFrom,
        dateTo: filter.dateTo,
        search: filter.search,
      });
      res.json(transactions);
    } catch {
      res.status(400).json({ message: 'Invalid filter parameters' });
    }
  });

  app.get('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const transaction = await storage.getTransaction(req.params.id, companyId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(transaction);
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({ ...validatedData, companyId });
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ message: 'Invalid transaction data', errors: error.errors });
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, companyId, validatedData);
      if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid transaction data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/transactions/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteTransaction(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Transaction not found' });
    res.status(204).send();
  });

  // ── Categories ────────────────────────────────────────────────────────────────

  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const type = req.query.type as 'income' | 'expense' | undefined;
    const categories = await storage.getCategories(companyId, type);
    res.json(categories);
  });

  app.get('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const category = await storage.getCategory(req.params.id, companyId);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const companyId = validatedData.companyId;
      if (!companyId) return res.status(400).json({ message: 'Company ID is required' });
      const hasPermission = await checkCompanyPermission(req, companyId, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const category = await storage.createCategory({ ...validatedData, companyId });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, companyId, validatedData);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid category data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteCategory(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Category not found' });
    res.status(204).send();
  });

  // ── Product Categories ────────────────────────────────────────────────────────

  app.get('/api/product-categories', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const categories = await storage.getProductCategories(companyId);
    res.json(categories);
  });

  app.get('/api/product-categories/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const category = await storage.getProductCategory(req.params.id, companyId);
    if (!category) return res.status(404).json({ message: 'Product category not found' });
    res.json(category);
  });

  app.post('/api/product-categories', isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const companyId = validatedData.companyId;
      if (!companyId) return res.status(400).json({ message: 'Company ID is required' });
      const hasPermission = await checkCompanyPermission(req, companyId, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const category = await storage.createProductCategory({ ...validatedData, companyId });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid product category data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/product-categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertProductCategorySchema.partial().parse(req.body);
      const category = await storage.updateProductCategory(req.params.id, companyId, validatedData);
      if (!category) return res.status(404).json({ message: 'Product category not found' });
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid product category data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/product-categories/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteProductCategory(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Product category not found' });
    res.status(204).send();
  });
}
