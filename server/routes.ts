import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTransactionSchema, 
  insertInventorySchema, 
  insertClientSchema, 
  insertSupplierSchema,
  insertCategorySchema,
  insertDocumentSchema,
  insertCompanySchema,
  transactionFilterSchema 
} from "@shared/schema";
import { z } from "zod";

// Helper to get companyId from request or use default
async function getCompanyId(req: any): Promise<string> {
  return (req.query.companyId as string) || await storage.getDefaultCompanyId();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Company routes
  app.get("/api/companies", async (req, res) => {
    const companies = await storage.getCompanies();
    res.json(companies);
  });

  app.get("/api/companies/:id", async (req, res) => {
    const company = await storage.getCompany(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  });

  app.post("/api/companies", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany(validatedData);
      res.status(201).json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid company data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/companies/:id", async (req, res) => {
    try {
      const validatedData = insertCompanySchema.partial().parse(req.body);
      const company = await storage.updateCompany(req.params.id, validatedData);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid company data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/companies/:id", async (req, res) => {
    const success = await storage.deleteCompany(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(204).send();
  });

  // Transaction routes
  app.get("/api/transactions", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const filter = transactionFilterSchema.parse(req.query);
      const transactions = await storage.getTransactions(companyId, {
        type: filter.type === 'all' ? undefined : filter.type,
        category: filter.category || undefined,
        dateFrom: filter.dateFrom,
        dateTo: filter.dateTo,
        search: filter.search,
      });
      res.json(transactions);
    } catch (error) {
      res.status(400).json({ message: "Invalid filter parameters" });
    }
  });

  app.get("/api/transactions/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const transaction = await storage.getTransaction(req.params.id, companyId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertTransactionSchema.partial().parse(req.body);
      const transaction = await storage.updateTransaction(req.params.id, companyId, validatedData);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/transactions/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const success = await storage.deleteTransaction(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(204).send();
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    const companyId = await getCompanyId(req);
    const inventory = await storage.getInventory(companyId);
    res.json(inventory);
  });

  app.get("/api/inventory/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const item = await storage.getInventoryItem(req.params.id, companyId);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(item);
  });

  app.post("/api/inventory", async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/inventory/:id", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertInventorySchema.partial().parse(req.body);
      const item = await storage.updateInventoryItem(req.params.id, companyId, validatedData);
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/inventory/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const success = await storage.deleteInventoryItem(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.status(204).send();
  });

  // Client routes
  app.get("/api/clients", async (req, res) => {
    const companyId = await getCompanyId(req);
    const clients = await storage.getClients(companyId);
    res.json(clients);
  });

  app.get("/api/clients/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const client = await storage.getClient(req.params.id, companyId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid client data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(req.params.id, companyId, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid client data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const success = await storage.deleteClient(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(204).send();
  });

  // Supplier routes
  app.get("/api/suppliers", async (req, res) => {
    const companyId = await getCompanyId(req);
    const suppliers = await storage.getSuppliers(companyId);
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const supplier = await storage.getSupplier(req.params.id, companyId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier(validatedData);
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/suppliers/:id", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(req.params.id, companyId, validatedData);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const success = await storage.deleteSupplier(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.status(204).send();
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    const companyId = await getCompanyId(req);
    const type = req.query.type as 'income' | 'expense' | undefined;
    const categories = await storage.getCategories(companyId, type);
    res.json(categories);
  });

  app.get("/api/categories/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const category = await storage.getCategory(req.params.id, companyId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory({
        ...validatedData,
        companyId,
      });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, companyId, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const success = await storage.deleteCategory(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(204).send();
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    const companyId = await getCompanyId(req);
    const documents = await storage.getDocuments(companyId);
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const document = await storage.getDocument(req.params.id, companyId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      const validatedData = insertDocumentSchema.partial().parse(req.body);
      const document = await storage.updateDocument(req.params.id, companyId, validatedData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    const companyId = await getCompanyId(req);
    const success = await storage.deleteDocument(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(204).send();
  });

  // Dashboard routes
  app.get("/api/dashboard/metrics", async (req, res) => {
    const companyId = await getCompanyId(req);
    const metrics = await storage.getMetrics(companyId);
    res.json(metrics);
  });

  app.get("/api/dashboard/monthly-data", async (req, res) => {
    const companyId = await getCompanyId(req);
    const data = await storage.getMonthlyData(companyId);
    res.json(data);
  });

  const httpServer = createServer(app);
  return httpServer;
}
