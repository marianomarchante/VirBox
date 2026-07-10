import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission } from '../middleware/auth.middleware';
import { insertClientSchema, insertSupplierSchema } from '@shared/schema';

export function registerCrmRoutes(app: Express) {
  // ── Clients ──────────────────────────────────────────────────────────────────

  app.get('/api/clients', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const clients = await storage.getClients(companyId);
    res.json(clients);
  });

  app.get('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const client = await storage.getClient(req.params.id, companyId);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  });

  app.post('/api/clients', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      const validatedData = insertClientSchema.parse(req.body);
      const dir3Regex = /^[A-Z0-9]{9}$/;
      if (validatedData.clientType === 'administracion_publica') {
        const dir3Errors: string[] = [];
        if (!validatedData.codigoOficinaContable || !dir3Regex.test(validatedData.codigoOficinaContable))
          dir3Errors.push('Código Oficina Contable: debe tener 9 caracteres alfanuméricos en mayúsculas');
        if (!validatedData.codigoOrganoGestor || !dir3Regex.test(validatedData.codigoOrganoGestor))
          dir3Errors.push('Código Órgano Gestor: debe tener 9 caracteres alfanuméricos en mayúsculas');
        if (!validatedData.codigoUnidadTramitadora || !dir3Regex.test(validatedData.codigoUnidadTramitadora))
          dir3Errors.push('Código Unidad Tramitadora: debe tener 9 caracteres alfanuméricos en mayúsculas');
        if (dir3Errors.length > 0) return res.status(400).json({ message: 'Códigos DIR3 inválidos', errors: dir3Errors });
      } else {
        validatedData.codigoOficinaContable = null;
        validatedData.codigoOrganoGestor = null;
        validatedData.codigoUnidadTramitadora = null;
      }
      const client = await storage.createClient({ ...validatedData, companyId });
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid client data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      const validatedData = insertClientSchema.partial().parse(req.body);
      const dir3Regex = /^[A-Z0-9]{9}$/;
      if (validatedData.clientType === 'administracion_publica') {
        const dir3Errors: string[] = [];
        if (!validatedData.codigoOficinaContable || !dir3Regex.test(validatedData.codigoOficinaContable))
          dir3Errors.push('Código Oficina Contable: debe tener 9 caracteres alfanuméricos en mayúsculas');
        if (!validatedData.codigoOrganoGestor || !dir3Regex.test(validatedData.codigoOrganoGestor))
          dir3Errors.push('Código Órgano Gestor: debe tener 9 caracteres alfanuméricos en mayúsculas');
        if (!validatedData.codigoUnidadTramitadora || !dir3Regex.test(validatedData.codigoUnidadTramitadora))
          dir3Errors.push('Código Unidad Tramitadora: debe tener 9 caracteres alfanuméricos en mayúsculas');
        if (dir3Errors.length > 0) return res.status(400).json({ message: 'Códigos DIR3 inválidos', errors: dir3Errors });
      } else if (validatedData.clientType && validatedData.clientType !== 'administracion_publica') {
        validatedData.codigoOficinaContable = null;
        validatedData.codigoOrganoGestor = null;
        validatedData.codigoUnidadTramitadora = null;
      }
      const client = await storage.updateClient(req.params.id, companyId, validatedData);
      if (!client) return res.status(404).json({ message: 'Client not found' });
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid client data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/clients/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteClient(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Client not found' });
    res.status(204).send();
  });

  // ── Suppliers ─────────────────────────────────────────────────────────────────

  app.get('/api/suppliers', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const suppliers = await storage.getSuppliers(companyId);
    res.json(suppliers);
  });

  app.get('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const supplier = await storage.getSupplier(req.params.id, companyId);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json(supplier);
  });

  app.post('/api/suppliers', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier({ ...validatedData, companyId });
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid supplier data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, companyId, validatedData);
      if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid supplier data', errors: error.errors });
      else res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/suppliers/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteSupplier(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Supplier not found' });
    res.status(204).send();
  });
}
