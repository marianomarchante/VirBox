import { eq, and, gte, lte, sql, ilike, or, inArray, desc, max } from 'drizzle-orm';
import { db } from './db';
import {
  users,
  userCompanyPermissions,
  companies,
  transactions,
  inventory,
  clients,
  suppliers,
  inventoryMovements,
  categories,
  productCategories,
  documentCategories,
  documents,
  events,
  articles,
  documentSequences,
  deliveryNotes,
  deliveryNoteLines,
  invoices,
  invoiceLines,
  invoiceVatBreakdown,
  type User,
  type UpsertUser,
  type UserCompanyPermission,
  type InsertUserCompanyPermission,
  type Company,
  type InsertCompany,
  type Transaction,
  type InsertTransaction,
  type Inventory,
  type InsertInventory,
  type Client,
  type InsertClient,
  type Supplier,
  type InsertSupplier,
  type InventoryMovement,
  type InsertInventoryMovement,
  type Category,
  type InsertCategory,
  type ProductCategory,
  type InsertProductCategory,
  type DocumentCategory,
  type InsertDocumentCategory,
  type Document,
  type InsertDocument,
  type Event,
  type InsertEvent,
  type Article,
  type InsertArticle,
  type DeliveryNote,
  type InsertDeliveryNote,
  type DeliveryNoteLine,
  type InsertDeliveryNoteLine,
  type Invoice,
  type InsertInvoice,
  type InvoiceLine,
  type InsertInvoiceLine,
  type InvoiceVatBreakdown,
  type InsertInvoiceVatBreakdown
} from '@shared/schema';
import type { IStorage } from './storage';

export class PostgresStorage implements IStorage {
  private defaultCompanyId: string | null = null;

  async getDefaultCompanyId(): Promise<string> {
    if (this.defaultCompanyId) {
      return this.defaultCompanyId;
    }

    const allCompanies = await db.select().from(companies).limit(1);
    if (allCompanies.length > 0) {
      this.defaultCompanyId = allCompanies[0].id;
      return this.defaultCompanyId;
    }

    const defaultCompany = await this.createCompany({
      name: 'Mi Organización',
      isActive: true,
    });
    
    this.defaultCompanyId = defaultCompany.id;
    
    await this.initializeDefaultCategories(this.defaultCompanyId);
    
    return this.defaultCompanyId;
  }

  private async initializeDefaultCategories(companyId: string) {
    const existingCategories = await db.select().from(categories).where(eq(categories.companyId, companyId)).limit(1);
    if (existingCategories.length > 0) {
      return;
    }

    const defaultIncomeCategories = [
      'Ventas - Productos',
      'Ventas - Servicios',
      'Donaciones',
      'Subvenciones',
      'Otros Ingresos',
    ];

    const defaultExpenseCategories = [
      'Materiales',
      'Suministros',
      'Mano de Obra',
      'Equipamiento',
      'Infraestructura',
      'Servicios',
      'Administrativos',
      'Otros Gastos',
    ];

    const incomeInserts = defaultIncomeCategories.map(name => ({
      companyId,
      name,
      type: 'income' as const,
      isActive: true,
    }));

    const expenseInserts = defaultExpenseCategories.map(name => ({
      companyId,
      name,
      type: 'expense' as const,
      isActive: true,
    }));

    await db.insert(categories).values([...incomeInserts, ...expenseInserts]);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const result = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.email);
  }

  async updateUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ isAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  // User-Company Permissions
  async getUserPermissions(userId: string): Promise<UserCompanyPermission[]> {
    return await db
      .select()
      .from(userCompanyPermissions)
      .where(eq(userCompanyPermissions.userId, userId));
  }

  async getUserPermissionForCompany(userId: string, companyId: string): Promise<UserCompanyPermission | undefined> {
    const result = await db
      .select()
      .from(userCompanyPermissions)
      .where(
        and(
          eq(userCompanyPermissions.userId, userId),
          eq(userCompanyPermissions.companyId, companyId)
        )
      )
      .limit(1);
    return result[0];
  }

  async setUserPermission(permission: InsertUserCompanyPermission): Promise<UserCompanyPermission> {
    const result = await db
      .insert(userCompanyPermissions)
      .values(permission)
      .onConflictDoUpdate({
        target: [userCompanyPermissions.userId, userCompanyPermissions.companyId],
        set: { role: permission.role },
      })
      .returning();
    return result[0];
  }

  async deleteUserPermission(userId: string, companyId: string): Promise<boolean> {
    const result = await db
      .delete(userCompanyPermissions)
      .where(
        and(
          eq(userCompanyPermissions.userId, userId),
          eq(userCompanyPermissions.companyId, companyId)
        )
      );
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUsersForCompany(companyId: string): Promise<Array<{ user: User; permission: UserCompanyPermission }>> {
    const permissions = await db
      .select()
      .from(userCompanyPermissions)
      .where(eq(userCompanyPermissions.companyId, companyId));

    const result = [];
    for (const permission of permissions) {
      const user = await this.getUser(permission.userId);
      if (user) {
        result.push({ user, permission });
      }
    }
    return result;
  }

  // Companies
  async getCompaniesForUser(userId: string): Promise<Company[]> {
    const user = await this.getUser(userId);
    if (user?.isAdmin) {
      return this.getCompanies();
    }

    const permissions = await this.getUserPermissions(userId);
    const companyIds = permissions.map(p => p.companyId);

    if (companyIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(companies)
      .where(inArray(companies.id, companyIds))
      .orderBy(companies.name);
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.name);
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result[0];
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const result = await db.insert(companies).values(insertCompany).returning();
    return result[0];
  }

  async updateCompany(id: string, update: Partial<InsertCompany>): Promise<Company | undefined> {
    const result = await db.update(companies).set(update).where(eq(companies.id, id)).returning();
    return result[0];
  }

  async deleteCompany(id: string): Promise<boolean> {
    // Execute cascade delete within a transaction to ensure atomicity
    return await db.transaction(async (tx) => {
      // Delete all related data in cascade before deleting the company
      await tx.delete(userCompanyPermissions).where(eq(userCompanyPermissions.companyId, id));
      await tx.delete(documents).where(eq(documents.companyId, id));
      await tx.delete(inventoryMovements).where(eq(inventoryMovements.companyId, id));
      await tx.delete(transactions).where(eq(transactions.companyId, id));
      await tx.delete(inventory).where(eq(inventory.companyId, id));
      await tx.delete(clients).where(eq(clients.companyId, id));
      await tx.delete(suppliers).where(eq(suppliers.companyId, id));
      await tx.delete(categories).where(eq(categories.companyId, id));
      await tx.delete(productCategories).where(eq(productCategories.companyId, id));
      
      // Finally, delete the company itself
      const result = await tx.delete(companies).where(eq(companies.id, id));
      return result.rowCount !== null && result.rowCount > 0;
    });
  }

  async getTransactions(companyId: string, filter?: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Transaction[]> {
    const conditions = [eq(transactions.companyId, companyId)];

    if (filter) {
      if (filter.type && filter.type !== 'all') {
        conditions.push(eq(transactions.type, filter.type));
      }
      if (filter.category) {
        conditions.push(eq(transactions.category, filter.category));
      }
      if (filter.dateFrom) {
        conditions.push(gte(transactions.date, new Date(filter.dateFrom)));
      }
      if (filter.dateTo) {
        conditions.push(lte(transactions.date, new Date(filter.dateTo)));
      }
      if (filter.search) {
        conditions.push(
          or(
            ilike(transactions.concept, `%${filter.search}%`),
            ilike(transactions.notes, `%${filter.search}%`)
          )!
        );
      }
    }

    return await db.select().from(transactions)
      .where(and(...conditions))
      .orderBy(sql`${transactions.date} DESC`);
  }

  async getTransaction(id: string, companyId: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const companyId = insertTransaction.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(transactions).values({
      ...insertTransaction,
      companyId,
    }).returning();

    if (insertTransaction.clientSupplierId) {
      if (insertTransaction.type === 'income') {
        await db.update(clients)
          .set({
            totalPurchases: sql`COALESCE(${clients.totalPurchases}, '0')::numeric + ${insertTransaction.amount}::numeric`,
            orderCount: sql`COALESCE(${clients.orderCount}, 0) + 1`,
          })
          .where(eq(clients.id, insertTransaction.clientSupplierId));
      } else {
        await db.update(suppliers)
          .set({
            totalPurchases: sql`COALESCE(${suppliers.totalPurchases}, '0')::numeric + ${insertTransaction.amount}::numeric`,
            orderCount: sql`COALESCE(${suppliers.orderCount}, 0) + 1`,
          })
          .where(eq(suppliers.id, insertTransaction.clientSupplierId));
      }
    }

    return result[0];
  }

  async updateTransaction(id: string, companyId: string, update: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions).set(update)
      .where(and(eq(transactions.id, id), eq(transactions.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteTransaction(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getInventory(companyId: string): Promise<Inventory[]> {
    return await db.select().from(inventory)
      .where(eq(inventory.companyId, companyId))
      .orderBy(inventory.name);
  }

  async getInventoryItem(id: string, companyId: string): Promise<Inventory | undefined> {
    const result = await db.select().from(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const companyId = insertItem.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(inventory).values({
      ...insertItem,
      companyId,
    }).returning();
    return result[0];
  }

  async updateInventoryItem(id: string, companyId: string, update: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const result = await db.update(inventory).set(update)
      .where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteInventoryItem(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(inventory)
      .where(and(eq(inventory.id, id), eq(inventory.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getClients(companyId: string): Promise<Client[]> {
    return await db.select().from(clients)
      .where(eq(clients.companyId, companyId))
      .orderBy(clients.name);
  }

  async getClient(id: string, companyId: string): Promise<Client | undefined> {
    const result = await db.select().from(clients)
      .where(and(eq(clients.id, id), eq(clients.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const companyId = insertClient.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(clients).values({
      ...insertClient,
      companyId,
    }).returning();
    return result[0];
  }

  async updateClient(id: string, companyId: string, update: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients).set(update)
      .where(and(eq(clients.id, id), eq(clients.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteClient(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(clients)
      .where(and(eq(clients.id, id), eq(clients.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSuppliers(companyId: string): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(eq(suppliers.companyId, companyId))
      .orderBy(suppliers.name);
  }

  async getSupplier(id: string, companyId: string): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const companyId = insertSupplier.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(suppliers).values({
      ...insertSupplier,
      companyId,
    }).returning();
    return result[0];
  }

  async updateSupplier(id: string, companyId: string, update: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers).set(update)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteSupplier(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(suppliers)
      .where(and(eq(suppliers.id, id), eq(suppliers.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getInventoryMovements(companyId: string, inventoryId?: string): Promise<InventoryMovement[]> {
    const conditions = [eq(inventoryMovements.companyId, companyId)];
    if (inventoryId) {
      conditions.push(eq(inventoryMovements.inventoryId, inventoryId));
    }
    return await db.select().from(inventoryMovements)
      .where(and(...conditions))
      .orderBy(sql`${inventoryMovements.date} DESC`);
  }

  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    const companyId = insertMovement.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(inventoryMovements).values({
      ...insertMovement,
      companyId,
    }).returning();

    const stockChange = insertMovement.type === 'in'
      ? sql`${inventory.currentStock}::numeric + ${insertMovement.quantity}::numeric`
      : sql`GREATEST(${inventory.currentStock}::numeric - ${insertMovement.quantity}::numeric, 0)`;

    await db.update(inventory)
      .set({
        currentStock: stockChange,
        lastUpdated: new Date(),
      })
      .where(eq(inventory.id, insertMovement.inventoryId));

    return result[0];
  }

  async getCategories(companyId: string, type?: 'income' | 'expense'): Promise<Category[]> {
    const conditions = [eq(categories.companyId, companyId)];
    if (type) {
      conditions.push(eq(categories.type, type));
    }
    return await db.select().from(categories)
      .where(and(...conditions))
      .orderBy(categories.name);
  }

  async getCategory(id: string, companyId: string): Promise<Category | undefined> {
    const result = await db.select().from(categories)
      .where(and(eq(categories.id, id), eq(categories.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const companyId = insertCategory.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(categories).values({
      ...insertCategory,
      companyId,
    }).returning();
    return result[0];
  }

  async updateCategory(id: string, companyId: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(update)
      .where(and(eq(categories.id, id), eq(categories.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteCategory(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(categories)
      .where(and(eq(categories.id, id), eq(categories.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getProductCategories(companyId: string): Promise<ProductCategory[]> {
    return await db.select().from(productCategories)
      .where(eq(productCategories.companyId, companyId))
      .orderBy(productCategories.name);
  }

  async getProductCategory(id: string, companyId: string): Promise<ProductCategory | undefined> {
    const result = await db.select().from(productCategories)
      .where(and(eq(productCategories.id, id), eq(productCategories.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createProductCategory(insertCategory: InsertProductCategory): Promise<ProductCategory> {
    const companyId = insertCategory.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(productCategories).values({
      ...insertCategory,
      companyId,
    }).returning();
    return result[0];
  }

  async updateProductCategory(id: string, companyId: string, update: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const result = await db.update(productCategories).set(update)
      .where(and(eq(productCategories.id, id), eq(productCategories.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteProductCategory(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(productCategories)
      .where(and(eq(productCategories.id, id), eq(productCategories.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDocumentCategories(companyId: string): Promise<DocumentCategory[]> {
    return await db.select().from(documentCategories)
      .where(eq(documentCategories.companyId, companyId))
      .orderBy(documentCategories.name);
  }

  async getDocumentCategory(id: string, companyId: string): Promise<DocumentCategory | undefined> {
    const result = await db.select().from(documentCategories)
      .where(and(eq(documentCategories.id, id), eq(documentCategories.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createDocumentCategory(insertCategory: InsertDocumentCategory): Promise<DocumentCategory> {
    const companyId = insertCategory.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(documentCategories).values({
      ...insertCategory,
      companyId,
    }).returning();
    return result[0];
  }

  async updateDocumentCategory(id: string, companyId: string, update: Partial<InsertDocumentCategory>): Promise<DocumentCategory | undefined> {
    const result = await db.update(documentCategories).set(update)
      .where(and(eq(documentCategories.id, id), eq(documentCategories.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteDocumentCategory(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(documentCategories)
      .where(and(eq(documentCategories.id, id), eq(documentCategories.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDocuments(companyId: string): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(sql`${documents.createdAt} DESC`);
  }

  async getDocument(id: string, companyId: string): Promise<Document | undefined> {
    const result = await db.select().from(documents)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const companyId = insertDocument.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(documents).values({
      ...insertDocument,
      companyId,
    }).returning();
    return result[0];
  }

  async updateDocument(id: string, companyId: string, update: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents).set(update)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteDocument(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(documents)
      .where(and(eq(documents.id, id), eq(documents.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getEvents(companyId: string): Promise<Event[]> {
    return await db.select().from(events)
      .where(eq(events.companyId, companyId))
      .orderBy(sql`${events.date} DESC`);
  }

  async getEvent(id: string, companyId: string): Promise<Event | undefined> {
    const result = await db.select().from(events)
      .where(and(eq(events.id, id), eq(events.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const companyId = insertEvent.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(events).values({
      ...insertEvent,
      companyId,
    }).returning();
    return result[0];
  }

  async updateEvent(id: string, companyId: string, update: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events).set(update)
      .where(and(eq(events.id, id), eq(events.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteEvent(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(events)
      .where(and(eq(events.id, id), eq(events.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getMetrics(companyId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }> {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0);

    const monthlyTransactions = await db.select()
      .from(transactions)
      .where(
        and(
          eq(transactions.companyId, companyId),
          gte(transactions.date, startDate),
          lte(transactions.date, endDate)
        )
      );

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      pendingPayments: totalIncome * 0.15,
    };
  }

  async getMonthlyData(companyId: string): Promise<{
    month: string;
    income: number;
    expenses: number;
  }[]> {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    const currentYear = new Date().getFullYear();
    const data = [];

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(currentYear, month, 1);
      const endDate = new Date(currentYear, month + 1, 0);

      const monthlyTransactions = await db.select()
        .from(transactions)
        .where(
          and(
            eq(transactions.companyId, companyId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate)
          )
        );

      const income = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const expenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      data.push({
        month: months[month],
        income,
        expenses,
      });
    }

    return data;
  }

  // Articles
  async getArticles(companyId: string): Promise<Article[]> {
    return await db.select().from(articles)
      .where(eq(articles.companyId, companyId))
      .orderBy(articles.name);
  }

  async getArticle(id: string, companyId: string): Promise<Article | undefined> {
    const result = await db.select().from(articles)
      .where(and(eq(articles.id, id), eq(articles.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createArticle(insertArticle: InsertArticle): Promise<Article> {
    const companyId = insertArticle.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(articles).values({
      ...insertArticle,
      companyId,
    }).returning();
    return result[0];
  }

  async updateArticle(id: string, companyId: string, update: Partial<InsertArticle>): Promise<Article | undefined> {
    const result = await db.update(articles)
      .set({ ...update, updatedAt: new Date() })
      .where(and(eq(articles.id, id), eq(articles.companyId, companyId)))
      .returning();
    return result[0];
  }

  async deleteArticle(id: string, companyId: string): Promise<boolean> {
    const result = await db.delete(articles)
      .where(and(eq(articles.id, id), eq(articles.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Delivery Notes
  async getDeliveryNotes(companyId: string): Promise<(DeliveryNote & { total: string })[]> {
    const notes = await db.select().from(deliveryNotes)
      .where(eq(deliveryNotes.companyId, companyId))
      .orderBy(desc(deliveryNotes.date));
    
    const notesWithTotals = await Promise.all(notes.map(async (note) => {
      const lines = await db.select().from(deliveryNoteLines)
        .where(eq(deliveryNoteLines.deliveryNoteId, note.id));
      const total = lines.reduce((sum, line) => {
        const qty = parseFloat(line.quantity) || 0;
        const price = parseFloat(line.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
      return { ...note, total: total.toFixed(2) };
    }));
    
    return notesWithTotals;
  }

  async getDeliveryNote(id: string, companyId: string): Promise<DeliveryNote | undefined> {
    const result = await db.select().from(deliveryNotes)
      .where(and(eq(deliveryNotes.id, id), eq(deliveryNotes.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createDeliveryNote(insertDeliveryNote: InsertDeliveryNote, lines: InsertDeliveryNoteLine[]): Promise<DeliveryNote> {
    const companyId = insertDeliveryNote.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(deliveryNotes).values({
      ...insertDeliveryNote,
      companyId,
    }).returning();
    
    const deliveryNote = result[0];
    
    if (lines.length > 0) {
      const linesWithId = lines.map((line, index) => ({
        ...line,
        deliveryNoteId: deliveryNote.id,
        lineOrder: index,
      }));
      await db.insert(deliveryNoteLines).values(linesWithId);
    }
    
    return deliveryNote;
  }

  async updateDeliveryNote(id: string, companyId: string, update: Partial<InsertDeliveryNote>, lines?: InsertDeliveryNoteLine[]): Promise<DeliveryNote | undefined> {
    const result = await db.update(deliveryNotes)
      .set({ ...update, updatedAt: new Date() })
      .where(and(eq(deliveryNotes.id, id), eq(deliveryNotes.companyId, companyId)))
      .returning();
    
    if (result[0] && lines && lines.length > 0) {
      await db.delete(deliveryNoteLines).where(eq(deliveryNoteLines.deliveryNoteId, id));
      const linesWithId = lines.map((line, index) => ({
        ...line,
        deliveryNoteId: id,
        lineOrder: index,
      }));
      await db.insert(deliveryNoteLines).values(linesWithId);
    }
    
    return result[0];
  }

  async deleteDeliveryNote(id: string, companyId: string): Promise<boolean> {
    await db.delete(deliveryNoteLines).where(eq(deliveryNoteLines.deliveryNoteId, id));
    const result = await db.delete(deliveryNotes)
      .where(and(eq(deliveryNotes.id, id), eq(deliveryNotes.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDeliveryNoteLines(deliveryNoteId: string): Promise<DeliveryNoteLine[]> {
    return await db.select().from(deliveryNoteLines)
      .where(eq(deliveryNoteLines.deliveryNoteId, deliveryNoteId))
      .orderBy(deliveryNoteLines.lineOrder);
  }

  async getNextDeliveryNoteNumber(companyId: string, series: string, year: number): Promise<number> {
    // First, try to get/update from the sequences table
    const existingSequence = await db.select()
      .from(documentSequences)
      .where(and(
        eq(documentSequences.documentType, 'delivery_note'),
        eq(documentSequences.companyId, companyId),
        eq(documentSequences.series, series),
        eq(documentSequences.year, year)
      ))
      .limit(1);
    
    if (existingSequence.length > 0) {
      // Update and return next number
      const nextNumber = existingSequence[0].lastNumber + 1;
      await db.update(documentSequences)
        .set({ lastNumber: nextNumber, updatedAt: new Date() })
        .where(eq(documentSequences.id, existingSequence[0].id));
      return nextNumber;
    }
    
    // No sequence exists - check for existing delivery notes from before sequences table
    const maxResult = await db.select({ maxNumber: max(deliveryNotes.number) })
      .from(deliveryNotes)
      .where(and(
        eq(deliveryNotes.companyId, companyId),
        eq(deliveryNotes.series, series),
        eq(deliveryNotes.year, year)
      ));
    
    const nextNumber = (maxResult[0]?.maxNumber || 0) + 1;
    
    // Create the sequence entry
    await db.insert(documentSequences).values({
      documentType: 'delivery_note',
      companyId,
      series,
      year,
      lastNumber: nextNumber,
    });
    
    return nextNumber;
  }

  // Invoices
  async getInvoices(companyId: string): Promise<Invoice[]> {
    return await db.select().from(invoices)
      .where(eq(invoices.companyId, companyId))
      .orderBy(desc(invoices.date));
  }

  async getInvoice(id: string, companyId: string): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .limit(1);
    return result[0];
  }

  async createInvoice(
    insertInvoice: InsertInvoice, 
    lines: InsertInvoiceLine[], 
    vatBreakdownItems: InsertInvoiceVatBreakdown[]
  ): Promise<Invoice> {
    const companyId = insertInvoice.companyId || await this.getDefaultCompanyId();
    const result = await db.insert(invoices).values({
      ...insertInvoice,
      companyId,
    }).returning();
    
    let invoice = result[0];
    
    if (lines.length > 0) {
      const linesWithId = lines.map((line, index) => ({
        ...line,
        invoiceId: invoice.id,
        lineOrder: index,
      }));
      await db.insert(invoiceLines).values(linesWithId);
    }
    
    if (vatBreakdownItems.length > 0) {
      const breakdownWithId = vatBreakdownItems.map(item => ({
        ...item,
        invoiceId: invoice.id,
      }));
      await db.insert(invoiceVatBreakdown).values(breakdownWithId);
    }
    
    // If invoice is issued, create the linked income transaction
    if (insertInvoice.status === 'issued') {
      invoice = await this.createIncomeFromInvoice(invoice);
    }
    
    return invoice;
  }
  
  private async createIncomeFromInvoice(invoice: Invoice): Promise<Invoice> {
    const concept = `Factura ${invoice.series || 'F'}-${invoice.number} - ${invoice.clientName}`;
    const category = invoice.incomeCategory || 'Ventas';
    
    const transactionResult = await db.insert(transactions).values({
      companyId: invoice.companyId,
      type: 'income',
      date: invoice.date,
      concept,
      category,
      amount: invoice.total,
      clientSupplierId: invoice.clientId,
      notes: invoice.notes,
      invoiceId: invoice.id,
    }).returning();
    
    const transaction = transactionResult[0];
    
    // Update invoice with the transaction ID
    const updatedResult = await db.update(invoices)
      .set({ transactionId: transaction.id, updatedAt: new Date() })
      .where(eq(invoices.id, invoice.id))
      .returning();
    
    return updatedResult[0] || invoice;
  }

  async updateInvoice(id: string, companyId: string, update: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    // Get the current invoice to check status changes
    const currentInvoice = await this.getInvoice(id, companyId);
    if (!currentInvoice) return undefined;
    
    const result = await db.update(invoices)
      .set({ ...update, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .returning();
    
    let updatedInvoice = result[0];
    if (!updatedInvoice) return undefined;
    
    // Determine effective status (use update if provided, otherwise current)
    const effectiveStatus = update.status || currentInvoice.status;
    const wasIssuedOrPaid = currentInvoice.status === 'issued' || currentInvoice.status === 'paid';
    const isNowIssuedOrPaid = effectiveStatus === 'issued' || effectiveStatus === 'paid';
    const isNowCancelled = effectiveStatus === 'cancelled';
    
    // Transition to cancelled: delete linked income
    if (isNowCancelled && currentInvoice.transactionId) {
      await db.delete(transactions).where(eq(transactions.id, currentInvoice.transactionId));
      await db.update(invoices)
        .set({ transactionId: null })
        .where(eq(invoices.id, id));
      updatedInvoice = { ...updatedInvoice, transactionId: null };
    }
    // Transition to issued/paid: create income if not exists
    else if (isNowIssuedOrPaid && !currentInvoice.transactionId) {
      updatedInvoice = await this.createIncomeFromInvoice(updatedInvoice);
    }
    // Update linked income if invoice has a transaction and any relevant data changed
    else if (currentInvoice.transactionId && isNowIssuedOrPaid) {
      const concept = `Factura ${updatedInvoice.series || 'F'}-${updatedInvoice.number} - ${updatedInvoice.clientName}`;
      await db.update(transactions)
        .set({
          date: updatedInvoice.date,
          concept,
          amount: updatedInvoice.total,
          notes: updatedInvoice.notes,
          category: updatedInvoice.incomeCategory || 'Ventas',
        })
        .where(eq(transactions.id, currentInvoice.transactionId));
    }
    
    return updatedInvoice;
  }

  async deleteInvoice(id: string, companyId: string): Promise<boolean> {
    // First, get the invoice to check for linked transaction
    const invoice = await this.getInvoice(id, companyId);
    
    // Delete linked transaction if exists
    if (invoice?.transactionId) {
      await db.delete(transactions).where(eq(transactions.id, invoice.transactionId));
    }
    
    await db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, id));
    await db.delete(invoiceVatBreakdown).where(eq(invoiceVatBreakdown.invoiceId, id));
    const result = await db.delete(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]> {
    return await db.select().from(invoiceLines)
      .where(eq(invoiceLines.invoiceId, invoiceId))
      .orderBy(invoiceLines.lineOrder);
  }

  async getInvoiceVatBreakdown(invoiceId: string): Promise<InvoiceVatBreakdown[]> {
    return await db.select().from(invoiceVatBreakdown)
      .where(eq(invoiceVatBreakdown.invoiceId, invoiceId));
  }

  async getNextInvoiceNumber(companyId: string, series: string, year: number): Promise<number> {
    // First, try to get/update from the sequences table
    const existingSequence = await db.select()
      .from(documentSequences)
      .where(and(
        eq(documentSequences.documentType, 'invoice'),
        eq(documentSequences.companyId, companyId),
        eq(documentSequences.series, series),
        eq(documentSequences.year, year)
      ))
      .limit(1);
    
    if (existingSequence.length > 0) {
      // Update and return next number
      const nextNumber = existingSequence[0].lastNumber + 1;
      await db.update(documentSequences)
        .set({ lastNumber: nextNumber, updatedAt: new Date() })
        .where(eq(documentSequences.id, existingSequence[0].id));
      return nextNumber;
    }
    
    // No sequence exists - check for existing invoices from before sequences table
    const maxResult = await db.select({ maxNumber: max(invoices.number) })
      .from(invoices)
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.series, series),
        eq(invoices.year, year)
      ));
    
    const nextNumber = (maxResult[0]?.maxNumber || 0) + 1;
    
    // Create the sequence entry
    await db.insert(documentSequences).values({
      documentType: 'invoice',
      companyId,
      series,
      year,
      lastNumber: nextNumber,
    });
    
    return nextNumber;
  }

  async updateInvoiceDocuments(id: string, companyId: string, pdfData: string | null, xmlData: string | null): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({ pdfData, xmlData, updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.companyId, companyId)))
      .returning();
    return result[0];
  }
}
