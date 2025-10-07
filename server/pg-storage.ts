import { eq, and, gte, lte, sql, ilike, or } from 'drizzle-orm';
import { db } from './db';
import {
  companies,
  transactions,
  inventory,
  clients,
  suppliers,
  inventoryMovements,
  categories,
  documents,
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
  type Document,
  type InsertDocument
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
    const result = await db.delete(companies).where(eq(companies.id, id));
    return result.rowCount !== null && result.rowCount > 0;
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

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
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

  async updateTransaction(id: string, update: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const result = await db.update(transactions).set(update).where(eq(transactions.id, id)).returning();
    return result[0];
  }

  async deleteTransaction(id: string): Promise<boolean> {
    const result = await db.delete(transactions).where(eq(transactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getInventory(companyId: string): Promise<Inventory[]> {
    return await db.select().from(inventory)
      .where(eq(inventory.companyId, companyId))
      .orderBy(inventory.name);
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
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

  async updateInventoryItem(id: string, update: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const result = await db.update(inventory).set(update).where(eq(inventory.id, id)).returning();
    return result[0];
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getClients(companyId: string): Promise<Client[]> {
    return await db.select().from(clients)
      .where(eq(clients.companyId, companyId))
      .orderBy(clients.name);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
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

  async updateClient(id: string, update: Partial<InsertClient>): Promise<Client | undefined> {
    const result = await db.update(clients).set(update).where(eq(clients.id, id)).returning();
    return result[0];
  }

  async deleteClient(id: string): Promise<boolean> {
    const result = await db.delete(clients).where(eq(clients.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getSuppliers(companyId: string): Promise<Supplier[]> {
    return await db.select().from(suppliers)
      .where(eq(suppliers.companyId, companyId))
      .orderBy(suppliers.name);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const result = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
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

  async updateSupplier(id: string, update: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const result = await db.update(suppliers).set(update).where(eq(suppliers.id, id)).returning();
    return result[0];
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
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

  async getCategory(id: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
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

  async updateCategory(id: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const result = await db.update(categories).set(update).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getDocuments(companyId: string): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.companyId, companyId))
      .orderBy(sql`${documents.createdAt} DESC`);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
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

  async updateDocument(id: string, update: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await db.update(documents).set(update).where(eq(documents.id, id)).returning();
    return result[0];
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
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
}
