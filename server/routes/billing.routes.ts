import type { Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { isAuthenticated, getCompanyIdWithPermission } from '../middleware/auth.middleware';
import {
  insertArticleSchema,
  insertDeliveryNoteSchema,
  insertDeliveryNoteLineSchema,
  insertInvoiceSchema,
  insertInvoiceLineSchema,
  insertInvoiceVatBreakdownSchema,
  insertAgriculturalReceiptSchema,
  insertAgriculturalReceiptLineSchema,
} from '@shared/schema';

export function registerBillingRoutes(app: Express) {
  // ── Articles ──────────────────────────────────────────────────────────────────

  app.get('/api/articles', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const articles = await storage.getArticles(companyId);
    res.json(articles);
  });

  app.get('/api/articles/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const article = await storage.getArticle(req.params.id, companyId);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  });

  app.post('/api/articles', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle({ ...validatedData, companyId });
      const autoCode = `ART-${article.id.substring(0, 8).toUpperCase()}`;
      const updatedArticle = await storage.updateArticle(article.id, companyId, { code: autoCode });
      res.status(201).json(updatedArticle || article);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid article data', errors: error.errors });
      else { console.error('Error creating article:', error); res.status(500).json({ message: 'Internal server error' }); }
    }
  });

  app.put('/api/articles/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertArticleSchema.partial().parse(req.body);
      const article = await storage.updateArticle(req.params.id, companyId, validatedData);
      if (!article) return res.status(404).json({ message: 'Article not found' });
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid article data', errors: error.errors });
      else { console.error('Error updating article:', error); res.status(500).json({ message: 'Internal server error' }); }
    }
  });

  app.delete('/api/articles/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteArticle(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Article not found' });
    res.status(204).send();
  });

  // ── Delivery Notes ─────────────────────────────────────────────────────────────

  app.get('/api/delivery-notes', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const deliveryNotes = await storage.getDeliveryNotes(companyId);
    res.json(deliveryNotes);
  });

  app.get('/api/delivery-notes/next-number', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const series = (req.query.series as string) || 'ALB';
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const nextNumber = await storage.getNextDeliveryNoteNumber(companyId, series, year);
    res.json({ nextNumber, series, year });
  });

  app.get('/api/delivery-notes/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const deliveryNote = await storage.getDeliveryNote(req.params.id, companyId);
    if (!deliveryNote) return res.status(404).json({ message: 'Delivery note not found' });
    const lines = await storage.getDeliveryNoteLines(req.params.id);
    res.json({ ...deliveryNote, lines });
  });

  app.post('/api/delivery-notes', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      const { lines, ...deliveryNoteData } = req.body;
      const validatedData = insertDeliveryNoteSchema.parse(deliveryNoteData);
      const validatedLines = z.array(insertDeliveryNoteLineSchema).parse(lines || []);

      const series = validatedData.series || 'ALB';
      const noteDate = new Date(validatedData.date);
      const year = noteDate.getFullYear();
      const nextNumber = await storage.getNextDeliveryNoteNumber(companyId, series, year);

      const deliveryNote = await storage.createDeliveryNote(
        { ...validatedData, companyId, series, number: nextNumber, year },
        validatedLines
      );
      res.status(201).json(deliveryNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Delivery note validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(400).json({ message: 'Invalid delivery note data', errors: error.errors });
      } else {
        console.error('Error creating delivery note:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.put('/api/delivery-notes/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      const { lines, ...noteData } = req.body;
      const validatedData = insertDeliveryNoteSchema.partial().parse(noteData);

      let validatedLines: any[] | undefined;
      if (lines && Array.isArray(lines)) {
        validatedLines = lines.map((line: any) => ({
          articleId: line.articleId || null,
          description: line.description || '',
          quantity: String(line.quantity || '0'),
          unitPrice: String(line.unitPrice || '0'),
          vatRate: String(line.vatRate || '21.00'),
        }));
      }

      const deliveryNote = await storage.updateDeliveryNote(req.params.id, companyId, validatedData, validatedLines);
      if (!deliveryNote) return res.status(404).json({ message: 'Delivery note not found' });
      res.json(deliveryNote);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid delivery note data', errors: error.errors });
      else { console.error('Error updating delivery note:', error); res.status(500).json({ message: 'Internal server error' }); }
    }
  });

  app.delete('/api/delivery-notes/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteDeliveryNote(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Delivery note not found' });
    res.status(204).send();
  });

  // ── Invoices ───────────────────────────────────────────────────────────────────

  app.get('/api/invoices', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const invoices = await storage.getInvoices(companyId);
    res.json(invoices);
  });

  app.get('/api/invoices/next-number', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const series = (req.query.series as string) || 'FAC';
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const nextNumber = await storage.getNextInvoiceNumber(companyId, series, year);
    res.json({ nextNumber, series, year });
  });

  app.get('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });

    const invoice = await storage.getInvoice(req.params.id, companyId);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const lines = await storage.getInvoiceLines(req.params.id);
    const vatBreakdown = await storage.getInvoiceVatBreakdown(req.params.id);

    let clientData: any = {};
    if (invoice.clientId) {
      const client = await storage.getClient(invoice.clientId, companyId);
      if (client) {
        clientData = {
          clientType: (client as any).clientType || 'particular',
          codigoOficinaContable: (client as any).codigoOficinaContable || null,
          codigoOrganoGestor: (client as any).codigoOrganoGestor || null,
          codigoUnidadTramitadora: (client as any).codigoUnidadTramitadora || null,
        };
      }
    }

    res.json({ ...invoice, lines, vatBreakdown, ...clientData });
  });

  // Create invoice from delivery notes
  app.post('/api/invoices/from-delivery-notes', isAuthenticated, async (req: any, res) => {
    try {
      const { deliveryNoteIds, invoiceData } = req.body;
      req.body.companyId = invoiceData?.companyId;

      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      if (!deliveryNoteIds || !Array.isArray(deliveryNoteIds) || deliveryNoteIds.length === 0) {
        return res.status(400).json({ message: 'No delivery notes selected' });
      }

      const allLines: any[] = [];
      let clientId = invoiceData.clientId;

      for (const noteId of deliveryNoteIds) {
        const note = await storage.getDeliveryNote(noteId, companyId);
        if (!note) return res.status(404).json({ message: `Delivery note ${noteId} not found` });
        if (note.status === 'invoiced') return res.status(400).json({ message: `Delivery note ${noteId} is already invoiced` });
        if (!clientId) clientId = note.clientId;
        const noteLines = await storage.getDeliveryNoteLines(noteId);
        allLines.push(...noteLines);
      }

      const processedLines = allLines.map((line: any, index: number) => {
        const quantity = parseFloat(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        const vatRate = parseFloat(line.vatRate) || 0;
        const subtotal = quantity * unitPrice;
        const vatAmount = subtotal * vatRate / 100;
        const total = subtotal + vatAmount;
        return {
          invoiceId: '', articleId: line.articleId || null, description: line.description || '',
          quantity: String(quantity), unitPrice: String(unitPrice), vatRate: String(vatRate),
          subtotal: subtotal.toFixed(2), vatAmount: vatAmount.toFixed(2), total: total.toFixed(2), lineOrder: index,
        };
      });

      const subtotal = processedLines.reduce((sum: number, l: any) => sum + parseFloat(l.subtotal), 0);
      const totalVat = processedLines.reduce((sum: number, l: any) => sum + parseFloat(l.vatAmount), 0);
      const irpfRate = parseFloat(invoiceData.irpfRate || '0');
      const irpfAmount = subtotal * irpfRate / 100;
      const total = subtotal + totalVat - irpfAmount;

      const series = invoiceData.series || 'FAC';
      const invoiceDate = new Date(invoiceData.date || new Date());
      const year = invoiceDate.getFullYear();
      const nextNumber = await storage.getNextInvoiceNumber(companyId, series, year);

      const vatGroups: { [rate: string]: { taxableBase: number; vatAmount: number } } = {};
      for (const line of processedLines) {
        const rate = line.vatRate;
        if (!vatGroups[rate]) vatGroups[rate] = { taxableBase: 0, vatAmount: 0 };
        vatGroups[rate].taxableBase += parseFloat(line.subtotal);
        vatGroups[rate].vatAmount += parseFloat(line.vatAmount);
      }
      const generatedVatBreakdown = Object.entries(vatGroups).map(([rate, values]) => ({
        invoiceId: '', vatRate: rate,
        taxableBase: values.taxableBase.toFixed(2), vatAmount: values.vatAmount.toFixed(2),
      }));

      const invoice = await storage.createInvoice({
        ...invoiceData, date: invoiceDate, companyId, clientId, series, number: nextNumber, year,
        subtotal: subtotal.toFixed(2), totalVat: totalVat.toFixed(2),
        irpfRate: irpfRate.toFixed(2), irpfAmount: irpfAmount.toFixed(2), total: total.toFixed(2), status: 'draft',
      }, processedLines, generatedVatBreakdown);

      for (const noteId of deliveryNoteIds) {
        await storage.updateDeliveryNote(noteId, companyId, { status: 'invoiced' });
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error('Error creating invoice from delivery notes:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/invoices', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      const { lines, vatBreakdown, ...invoiceData } = req.body;
      const validatedData = insertInvoiceSchema.parse(invoiceData);

      const rawLines = lines || [];
      const processedLines = rawLines.map((line: any, index: number) => {
        const quantity = parseFloat(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        const vatRate = parseFloat(line.vatRate) || 0;
        const subtotal = quantity * unitPrice;
        const vatAmount = subtotal * vatRate / 100;
        const total = subtotal + vatAmount;
        return {
          invoiceId: '', articleId: line.articleId || null, description: line.description || '',
          quantity: String(quantity), unitPrice: String(unitPrice), vatRate: String(vatRate),
          subtotal: subtotal.toFixed(2), vatAmount: vatAmount.toFixed(2), total: total.toFixed(2), lineOrder: index,
        };
      });

      const subtotal = processedLines.reduce((sum: number, l: any) => sum + parseFloat(l.subtotal), 0);
      const totalVat = processedLines.reduce((sum: number, l: any) => sum + parseFloat(l.vatAmount), 0);
      const irpfRate = parseFloat(validatedData.irpfRate || '0');
      const irpfAmount = subtotal * irpfRate / 100;
      const total = subtotal + totalVat - irpfAmount;

      const series = validatedData.series || 'FAC';
      const invoiceDate = new Date(validatedData.date);
      const year = invoiceDate.getFullYear();
      const nextNumber = await storage.getNextInvoiceNumber(companyId, series, year);

      const vatGroups: { [rate: string]: { taxableBase: number; vatAmount: number } } = {};
      for (const line of processedLines) {
        const rate = line.vatRate;
        if (!vatGroups[rate]) vatGroups[rate] = { taxableBase: 0, vatAmount: 0 };
        vatGroups[rate].taxableBase += parseFloat(line.subtotal);
        vatGroups[rate].vatAmount += parseFloat(line.vatAmount);
      }
      const generatedVatBreakdown = Object.entries(vatGroups).map(([rate, values]) => ({
        invoiceId: '', vatRate: rate,
        taxableBase: values.taxableBase.toFixed(2), vatAmount: values.vatAmount.toFixed(2),
      }));

      const invoice = await storage.createInvoice({
        ...validatedData, companyId, series, number: nextNumber, year,
        subtotal: subtotal.toFixed(2), totalVat: totalVat.toFixed(2),
        irpfRate: irpfRate.toFixed(2), irpfAmount: irpfAmount.toFixed(2), total: total.toFixed(2),
      }, processedLines, generatedVatBreakdown);

      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(400).json({ message: 'Invalid invoice data', errors: error.errors });
      } else {
        console.error('Error creating invoice:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });

  app.put('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, companyId, validatedData);
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) res.status(400).json({ message: 'Invalid invoice data', errors: error.errors });
      else { console.error('Error updating invoice:', error); res.status(500).json({ message: 'Internal server error' }); }
    }
  });

  app.patch('/api/invoices/:id/documents', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const { pdfData, xmlData } = req.body;
      const invoice = await storage.updateInvoiceDocuments(req.params.id, companyId, pdfData, xmlData);
      if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
      res.json(invoice);
    } catch (error) {
      console.error('Error updating invoice documents:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

    const confirmCif = req.query.confirmCif as string;
    if (!confirmCif) return res.status(400).json({ message: 'Se requiere confirmar el CIF de la empresa' });

    const company = await storage.getCompany(companyId);
    if (!company || company.taxId?.toUpperCase() !== confirmCif.toUpperCase()) {
      return res.status(400).json({ message: 'El código de eliminación no es correcto' });
    }

    const success = await storage.deleteInvoice(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Invoice not found' });
    res.status(204).send();
  });

  // ── Agricultural Receipts ──────────────────────────────────────────────────────

  app.get('/api/agricultural-receipts', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const receipts = await storage.getAgriculturalReceipts(companyId);
    res.json(receipts);
  });

  app.get('/api/agricultural-receipts/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: No access to this company' });
    const receipt = await storage.getAgriculturalReceipt(req.params.id, companyId);
    if (!receipt) return res.status(404).json({ message: 'Agricultural receipt not found' });
    const lines = await storage.getAgriculturalReceiptLines(receipt.id);
    res.json({ ...receipt, lines });
  });

  app.post('/api/agricultural-receipts', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });

      const { lines: rawLines, ...receiptData } = req.body;
      const validatedReceipt = insertAgriculturalReceiptSchema.parse({ ...receiptData, companyId });
      const validatedLines = (rawLines || []).map((line: any) =>
        insertAgriculturalReceiptLineSchema.parse(line)
      );

      const receipt = await storage.createAgriculturalReceipt(validatedReceipt, validatedLines);

      if (receipt.status === 'issued' || receipt.status === 'paid') {
        const transaction = await storage.createTransaction({
          companyId,
          type: 'expense',
          date: receipt.date,
          concept: `Recibo Agrario ${receipt.series}-${receipt.year}-${String(receipt.number).padStart(4, '0')} - ${receipt.supplierName}`,
          category: receipt.expenseCategory || 'Compensación REAGP',
          amount: receipt.total,
          taxableBase: receipt.subtotal,
          vatAmount: '0',
          irpfRate: '0',
          irpfAmount: '0',
          clientSupplierId: receipt.supplierId,
          notes: receipt.notes || null,
        });
        await storage.updateAgriculturalReceipt(receipt.id, companyId, { transactionId: transaction.id } as any);
      }

      res.status(201).json(receipt);
    } catch (error: any) {
      if (error.name === 'ZodError') res.status(400).json({ message: 'Invalid receipt data', errors: error.errors });
      else { console.error('Error creating agricultural receipt:', error); res.status(500).json({ message: 'Internal server error' }); }
    }
  });

  app.put('/api/agricultural-receipts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const validatedData = insertAgriculturalReceiptSchema.partial().parse(req.body);
      const receipt = await storage.updateAgriculturalReceipt(req.params.id, companyId, validatedData);
      if (!receipt) return res.status(404).json({ message: 'Agricultural receipt not found' });
      res.json(receipt);
    } catch (error: any) {
      if (error.name === 'ZodError') res.status(400).json({ message: 'Invalid receipt data', errors: error.errors });
      else { console.error('Error updating agricultural receipt:', error); res.status(500).json({ message: 'Internal server error' }); }
    }
  });

  app.patch('/api/agricultural-receipts/:id/pdf', isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
      const { pdfData } = req.body;
      const receipt = await storage.updateAgriculturalReceiptPdf(req.params.id, companyId, pdfData);
      if (!receipt) return res.status(404).json({ message: 'Agricultural receipt not found' });
      res.json(receipt);
    } catch (error) {
      console.error('Error updating agricultural receipt PDF:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/agricultural-receipts/:id', isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) return res.status(403).json({ message: 'Forbidden: Admin permission required' });
    const success = await storage.deleteAgriculturalReceipt(req.params.id, companyId);
    if (!success) return res.status(404).json({ message: 'Agricultural receipt not found' });
    res.status(204).send();
  });
}
