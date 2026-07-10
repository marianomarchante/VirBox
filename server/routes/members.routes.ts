import type { Express } from 'express';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission } from '../middleware/auth.middleware';
import {
  insertMemberTypeSchema,
  insertSeasonSchema,
  insertMemberSchema,
  insertMemberFeePaymentSchema,
} from '@shared/schema';

export function registerMemberRoutes(app: Express) {
  // ── Member Types ─────────────────────────────────────────────────────────────

  app.get('/api/member-types', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden' });
    const types = await storage.getMemberTypes(companyId);
    res.json(types);
  });

  app.post('/api/member-types', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertMemberTypeSchema.parse({ ...req.body, companyId });
      const memberType = await storage.createMemberType(data);
      res.status(201).json(memberType);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put('/api/member-types/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertMemberTypeSchema.partial().parse(req.body);
      const updated = await storage.updateMemberType(req.params.id, companyId, data);
      if (!updated) return res.status(404).json({ message: 'Member type not found' });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete('/api/member-types/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteMemberType(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Member type not found' });
    res.status(204).send();
  });

  // ── Seasons ────────────────────────────────────────────────────────────────────

  app.get('/api/seasons', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden' });
    const [seasonsList, suggestedNext] = await Promise.all([
      storage.getSeasons(companyId),
      storage.getSuggestedNextSeason(companyId),
    ]);
    res.json({ seasons: seasonsList, suggestedNext });
  });

  app.post('/api/seasons', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertSeasonSchema.parse({ ...req.body, companyId });
      const season = await storage.createSeason(data);
      res.status(201).json(season);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put('/api/seasons/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertSeasonSchema.partial().parse(req.body);
      const updated = await storage.updateSeason(req.params.id, companyId, data);
      if (!updated) return res.status(404).json({ message: 'Season not found' });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete('/api/seasons/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteSeason(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Season not found' });
    res.status(204).send();
  });

  // ── Members ────────────────────────────────────────────────────────────────────

  app.get('/api/members', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden' });
    const { memberTypeId, isActive, search } = req.query;
    const filter: any = {};
    if (memberTypeId) filter.memberTypeId = memberTypeId;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.search = search;
    const membersList = await storage.getMembers(companyId, filter);
    res.json(membersList);
  });

  app.get('/api/members/next-number', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden' });
    const nextNumber = await storage.getNextMemberNumber(companyId);
    res.json({ nextNumber });
  });

  app.post('/api/members', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertMemberSchema.parse({ ...req.body, companyId });
      const member = await storage.createMember(data);
      res.status(201).json(member);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put('/api/members/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertMemberSchema.partial().parse(req.body);
      const updated = await storage.updateMember(req.params.id, companyId, data);
      if (!updated) return res.status(404).json({ message: 'Member not found' });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete('/api/members/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteMember(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Member not found' });
    res.status(204).send();
  });

  // ── Member Fee Payments ──────────────────────────────────────────────────────────

  app.get('/api/member-fee-payments', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden' });
    const { seasonId, memberId, isPaid } = req.query;
    const filter: any = {};
    if (seasonId) filter.seasonId = seasonId;
    if (memberId) filter.memberId = memberId;
    if (isPaid !== undefined) filter.isPaid = isPaid === 'true';
    const payments = await storage.getMemberFeePayments(companyId, filter);
    res.json(payments);
  });

  app.post('/api/member-fee-payments', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertMemberFeePaymentSchema.parse({ ...req.body, companyId });
      const payment = await storage.createMemberFeePayment(data);
      res.status(201).json(payment);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.post('/api/member-fee-payments/bulk-generate', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const { seasonId } = req.body;
      if (!seasonId) return res.status(400).json({ message: 'seasonId is required' });
      const payments = await storage.bulkGenerateMemberFeePayments(companyId, seasonId);
      res.status(201).json({ generated: payments.length, payments });
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put('/api/member-fee-payments/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    try {
      const data = insertMemberFeePaymentSchema.partial().parse(req.body);
      const updated = await storage.updateMemberFeePayment(req.params.id, companyId, data);
      if (!updated) return res.status(404).json({ message: 'Payment not found' });
      res.json(updated);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete('/api/member-fee-payments/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteMemberFeePayment(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Payment not found' });
    res.status(204).send();
  });
}
