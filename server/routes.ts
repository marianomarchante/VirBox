import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertTransactionSchema, 
  insertInventorySchema, 
  insertClientSchema, 
  insertSupplierSchema,
  insertCategorySchema,
  insertProductCategorySchema,
  insertDocumentCategorySchema,
  insertDocumentSchema,
  insertEventSchema,
  insertCompanySchema,
  insertUserCompanyPermissionSchema,
  transactionFilterSchema,
  insertArticleSchema,
  insertDeliveryNoteSchema,
  insertDeliveryNoteLineSchema,
  insertInvoiceSchema,
  insertInvoiceLineSchema,
  insertInvoiceVatBreakdownSchema
} from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is admin
function isAdmin(req: any, res: any, next: any) {
  const userId = req.user?.claims?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  storage.getUser(userId).then(user => {
    if (!user?.isAdmin) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    next();
  }).catch(() => {
    res.status(500).json({ message: "Internal server error" });
  });
}

// Middleware to check user permissions for a company
async function checkCompanyPermission(req: any, companyId: string, requiredRole?: 'administracion'): Promise<boolean> {
  const userId = req.user?.claims?.sub;
  if (!userId) {
    return false;
  }

  const user = await storage.getUser(userId);
  
  // Admins have access to all companies
  if (user?.isAdmin) {
    return true;
  }

  // Check user permissions for this company
  const permission = await storage.getUserPermissionForCompany(userId, companyId);
  if (!permission) {
    return false;
  }

  // If specific role required, check it
  if (requiredRole && permission.role !== requiredRole) {
    return false;
  }

  return true;
}

// Helper to get companyId from request with permission check
async function getCompanyIdWithPermission(req: any, requiredRole?: 'administracion'): Promise<{ companyId: string; hasPermission: boolean }> {
  const companyId = (req.query.companyId || req.body?.companyId) as string;
  if (!companyId) {
    return { companyId: '', hasPermission: false };
  }
  const hasPermission = await checkCompanyPermission(req, companyId, requiredRole);
  return { companyId, hasPermission };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/auth/permissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const permissions = await storage.getUserPermissions(userId);
      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ message: "Failed to fetch permissions" });
    }
  });

  // Get user permission for a specific company
  app.get('/api/auth/permissions/:companyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companyId = req.params.companyId;
      
      // Check if user is a global admin
      const user = await storage.getUser(userId);
      if (user?.isAdmin) {
        // Global admins have full access to all companies
        return res.json([{
          id: 'admin-access',
          userId,
          companyId,
          role: 'administracion',
          createdAt: new Date()
        }]);
      }

      // Get specific permission for this company
      const permission = await storage.getUserPermissionForCompany(userId, companyId);
      if (permission) {
        res.json([permission]);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching company permission:", error);
      res.status(500).json({ message: "Failed to fetch company permission" });
    }
  });

  // Admin-only routes for user management
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put("/api/admin/users/:userId/admin", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { isAdmin: adminStatus } = req.body;
      const user = await storage.updateUserAdmin(req.params.userId, adminStatus);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.get("/api/admin/companies/:companyId/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsersForCompany(req.params.companyId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company users" });
    }
  });

  app.get("/api/admin/users/:userId/permissions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user permissions" });
    }
  });

  app.post("/api/admin/permissions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertUserCompanyPermissionSchema.parse(req.body);
      const permission = await storage.setUserPermission(validatedData);
      res.status(201).json(permission);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid permission data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to set permission" });
      }
    }
  });

  app.delete("/api/admin/permissions/:userId/:companyId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const success = await storage.deleteUserPermission(req.params.userId, req.params.companyId);
      if (!success) {
        return res.status(404).json({ message: "Permission not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete permission" });
    }
  });

  // Company routes (protected)
  app.get("/api/companies", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const companies = await storage.getCompaniesForUser(userId);
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get("/api/companies/:id", isAuthenticated, async (req: any, res) => {
    const hasPermission = await checkCompanyPermission(req, req.params.id);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const company = await storage.getCompany(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.json(company);
  });

  app.post("/api/companies", isAuthenticated, isAdmin, async (req, res) => {
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

  app.put("/api/companies/:id", isAuthenticated, async (req: any, res) => {
    const hasPermission = await checkCompanyPermission(req, req.params.id, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

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

  app.delete("/api/companies/:id", isAuthenticated, isAdmin, async (req, res) => {
    const success = await storage.deleteCompany(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(204).send();
  });

  // Transaction routes (protected)
  app.get("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: No access to this company" });
      }

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

  app.get("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const transaction = await storage.getTransaction(req.params.id, companyId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.json(transaction);
  });

  app.post("/api/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({
        ...validatedData,
        companyId
      });
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid transaction data", 
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.delete("/api/transactions/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteTransaction(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(204).send();
  });

  // Inventory routes (protected)
  app.get("/api/inventory", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const inventory = await storage.getInventory(companyId);
    res.json(inventory);
  });

  app.get("/api/inventory/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const item = await storage.getInventoryItem(req.params.id, companyId);
    if (!item) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(item);
  });

  app.post("/api/inventory", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertInventorySchema.parse(req.body);
      const item = await storage.createInventoryItem({
        ...validatedData,
        companyId
      });
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid inventory data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/inventory/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.delete("/api/inventory/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteInventoryItem(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.status(204).send();
  });

  // Client routes (protected)
  app.get("/api/clients", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const clients = await storage.getClients(companyId);
    res.json(clients);
  });

  app.get("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const client = await storage.getClient(req.params.id, companyId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(client);
  });

  app.post("/api/clients", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient({
        ...validatedData,
        companyId
      });
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid client data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.delete("/api/clients/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteClient(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(204).send();
  });

  // Supplier routes (protected)
  app.get("/api/suppliers", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const suppliers = await storage.getSuppliers(companyId);
    res.json(suppliers);
  });

  app.get("/api/suppliers/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const supplier = await storage.getSupplier(req.params.id, companyId);
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json(supplier);
  });

  app.post("/api/suppliers", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertSupplierSchema.parse(req.body);
      const supplier = await storage.createSupplier({
        ...validatedData,
        companyId
      });
      res.status(201).json(supplier);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid supplier data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/suppliers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.delete("/api/suppliers/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteSupplier(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.status(204).send();
  });

  // Category routes (protected)
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const type = req.query.type as 'income' | 'expense' | undefined;
    const categories = await storage.getCategories(companyId, type);
    res.json(categories);
  });

  app.get("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const category = await storage.getCategory(req.params.id, companyId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCategorySchema.parse(req.body);
      const companyId = validatedData.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      const hasPermission = await checkCompanyPermission(req, companyId, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.put("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.delete("/api/categories/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteCategory(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(204).send();
  });

  // Product Category routes (protected)
  app.get("/api/product-categories", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const categories = await storage.getProductCategories(companyId);
    res.json(categories);
  });

  app.get("/api/product-categories/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const category = await storage.getProductCategory(req.params.id, companyId);
    if (!category) {
      return res.status(404).json({ message: "Product category not found" });
    }
    res.json(category);
  });

  app.post("/api/product-categories", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertProductCategorySchema.parse(req.body);
      const companyId = validatedData.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      const hasPermission = await checkCompanyPermission(req, companyId, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const category = await storage.createProductCategory({
        ...validatedData,
        companyId
      });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/product-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertProductCategorySchema.partial().parse(req.body);
      const category = await storage.updateProductCategory(req.params.id, companyId, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Product category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid product category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/product-categories/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteProductCategory(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Product category not found" });
    }
    res.status(204).send();
  });

  // Document Category routes (protected)
  app.get("/api/document-categories", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const categories = await storage.getDocumentCategories(companyId);
    res.json(categories);
  });

  app.get("/api/document-categories/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const category = await storage.getDocumentCategory(req.params.id, companyId);
    if (!category) {
      return res.status(404).json({ message: "Document category not found" });
    }
    res.json(category);
  });

  app.post("/api/document-categories", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertDocumentCategorySchema.parse(req.body);
      const companyId = validatedData.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: "Company ID is required" });
      }

      const hasPermission = await checkCompanyPermission(req, companyId, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const category = await storage.createDocumentCategory({
        ...validatedData,
        companyId,
      });
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/document-categories/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertDocumentCategorySchema.partial().parse(req.body);
      const category = await storage.updateDocumentCategory(req.params.id, companyId, validatedData);
      if (!category) {
        return res.status(404).json({ message: "Document category not found" });
      }
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document category data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/document-categories/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteDocumentCategory(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Document category not found" });
    }
    res.status(204).send();
  });

  // Document routes (protected)
  app.get("/api/documents", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const documents = await storage.getDocuments(companyId);
    res.json(documents);
  });

  app.get("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const document = await storage.getDocument(req.params.id, companyId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.json(document);
  });

  app.post("/api/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument({
        ...validatedData,
        companyId
      });
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid document data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

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

  app.delete("/api/documents/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteDocument(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Document not found" });
    }
    res.status(204).send();
  });

  // Event routes (protected)
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const events = await storage.getEvents(companyId);
    res.json(events);
  });

  app.get("/api/events/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const event = await storage.getEvent(req.params.id, companyId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });

  app.post("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({
        ...validatedData,
        companyId
      });
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertEventSchema.partial().parse(req.body);
      const event = await storage.updateEvent(req.params.id, companyId, validatedData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid event data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/events/:id/read", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const event = await storage.updateEvent(req.params.id, companyId, { isRead: true } as any);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  });

  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteEvent(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.status(204).send();
  });

  // Dashboard routes (protected)
  app.get("/api/dashboard/metrics", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const metrics = await storage.getMetrics(companyId);
    res.json(metrics);
  });

  app.get("/api/dashboard/monthly-data", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const data = await storage.getMonthlyData(companyId);
    res.json(data);
  });

  // Articles routes
  app.get("/api/articles", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const articles = await storage.getArticles(companyId);
    res.json(articles);
  });

  app.get("/api/articles/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const article = await storage.getArticle(req.params.id, companyId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.json(article);
  });

  app.post("/api/articles", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle({
        ...validatedData,
        companyId
      });
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid article data", errors: error.errors });
      } else {
        console.error("Error creating article:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/articles/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertArticleSchema.partial().parse(req.body);
      const article = await storage.updateArticle(req.params.id, companyId, validatedData);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid article data", errors: error.errors });
      } else {
        console.error("Error updating article:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/articles/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteArticle(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Article not found" });
    }
    res.status(204).send();
  });

  // Delivery Notes routes
  app.get("/api/delivery-notes", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const deliveryNotes = await storage.getDeliveryNotes(companyId);
    res.json(deliveryNotes);
  });

  app.get("/api/delivery-notes/next-number", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const series = (req.query.series as string) || "ALB";
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const nextNumber = await storage.getNextDeliveryNoteNumber(companyId, series, year);
    res.json({ nextNumber, series, year });
  });

  app.get("/api/delivery-notes/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const deliveryNote = await storage.getDeliveryNote(req.params.id, companyId);
    if (!deliveryNote) {
      return res.status(404).json({ message: "Delivery note not found" });
    }
    
    const lines = await storage.getDeliveryNoteLines(req.params.id);
    res.json({ ...deliveryNote, lines });
  });

  app.post("/api/delivery-notes", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const { lines, ...deliveryNoteData } = req.body;
      const validatedData = insertDeliveryNoteSchema.parse(deliveryNoteData);
      const validatedLines = z.array(insertDeliveryNoteLineSchema).parse(lines || []);
      
      const deliveryNote = await storage.createDeliveryNote({
        ...validatedData,
        companyId
      }, validatedLines);
      
      res.status(201).json(deliveryNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid delivery note data", errors: error.errors });
      } else {
        console.error("Error creating delivery note:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/delivery-notes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertDeliveryNoteSchema.partial().parse(req.body);
      const deliveryNote = await storage.updateDeliveryNote(req.params.id, companyId, validatedData);
      if (!deliveryNote) {
        return res.status(404).json({ message: "Delivery note not found" });
      }
      res.json(deliveryNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid delivery note data", errors: error.errors });
      } else {
        console.error("Error updating delivery note:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete("/api/delivery-notes/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteDeliveryNote(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Delivery note not found" });
    }
    res.status(204).send();
  });

  // Invoices routes
  app.get("/api/invoices", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const invoices = await storage.getInvoices(companyId);
    res.json(invoices);
  });

  app.get("/api/invoices/next-number", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const series = (req.query.series as string) || "FAC";
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const nextNumber = await storage.getNextInvoiceNumber(companyId, series, year);
    res.json({ nextNumber, series, year });
  });

  app.get("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req);
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: No access to this company" });
    }

    const invoice = await storage.getInvoice(req.params.id, companyId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    const lines = await storage.getInvoiceLines(req.params.id);
    const vatBreakdown = await storage.getInvoiceVatBreakdown(req.params.id);
    res.json({ ...invoice, lines, vatBreakdown });
  });

  app.post("/api/invoices", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const { lines, vatBreakdown, ...invoiceData } = req.body;
      
      // Validate basic invoice data
      const validatedData = insertInvoiceSchema.parse(invoiceData);
      
      // Process lines: calculate subtotal, vatAmount, total for each line
      const rawLines = lines || [];
      const processedLines = rawLines.map((line: any, index: number) => {
        const quantity = parseFloat(line.quantity) || 0;
        const unitPrice = parseFloat(line.unitPrice) || 0;
        const vatRate = parseFloat(line.vatRate) || 0;
        const subtotal = quantity * unitPrice;
        const vatAmount = subtotal * vatRate / 100;
        const total = subtotal + vatAmount;
        
        return {
          invoiceId: '', // Will be set after invoice creation
          articleId: line.articleId || null,
          description: line.description || '',
          quantity: String(quantity),
          unitPrice: String(unitPrice),
          vatRate: String(vatRate),
          subtotal: subtotal.toFixed(2),
          vatAmount: vatAmount.toFixed(2),
          total: total.toFixed(2),
          lineOrder: index,
        };
      });
      
      // Calculate invoice totals from lines
      const subtotal = processedLines.reduce((sum: number, line: any) => sum + parseFloat(line.subtotal), 0);
      const totalVat = processedLines.reduce((sum: number, line: any) => sum + parseFloat(line.vatAmount), 0);
      const total = subtotal + totalVat;
      
      // Generate VAT breakdown from lines
      const vatGroups: { [rate: string]: { taxableBase: number; vatAmount: number } } = {};
      for (const line of processedLines) {
        const rate = line.vatRate;
        if (!vatGroups[rate]) {
          vatGroups[rate] = { taxableBase: 0, vatAmount: 0 };
        }
        vatGroups[rate].taxableBase += parseFloat(line.subtotal);
        vatGroups[rate].vatAmount += parseFloat(line.vatAmount);
      }
      
      const generatedVatBreakdown = Object.entries(vatGroups).map(([rate, values]) => ({
        invoiceId: '', // Will be set after invoice creation
        vatRate: rate,
        taxableBase: values.taxableBase.toFixed(2),
        vatAmount: values.vatAmount.toFixed(2),
      }));
      
      const invoice = await storage.createInvoice({
        ...validatedData,
        companyId,
        subtotal: subtotal.toFixed(2),
        totalVat: totalVat.toFixed(2),
        total: total.toFixed(2),
      }, processedLines, generatedVatBreakdown);
      
      res.status(201).json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Zod validation errors:", JSON.stringify(error.errors, null, 2));
        res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      } else {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.put("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const validatedData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, companyId, validatedData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid invoice data", errors: error.errors });
      } else {
        console.error("Error updating invoice:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch("/api/invoices/:id/documents", isAuthenticated, async (req: any, res) => {
    try {
      const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
      if (!hasPermission) {
        return res.status(403).json({ message: "Forbidden: Admin permission required" });
      }

      const { pdfData, xmlData } = req.body;
      const invoice = await storage.updateInvoiceDocuments(req.params.id, companyId, pdfData, xmlData);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice documents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/invoices/:id", isAuthenticated, async (req: any, res) => {
    const { companyId, hasPermission } = await getCompanyIdWithPermission(req, 'administracion');
    if (!hasPermission) {
      return res.status(403).json({ message: "Forbidden: Admin permission required" });
    }

    const success = await storage.deleteInvoice(req.params.id, companyId);
    if (!success) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
