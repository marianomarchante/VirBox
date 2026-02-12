import { 
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
  type User,
  type UpsertUser,
  type UserCompanyPermission,
  type InsertUserCompanyPermission,
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
  type InsertInvoiceVatBreakdown,
  type AgriculturalReceipt,
  type InsertAgriculturalReceipt,
  type AgriculturalReceiptLine,
  type InsertAgriculturalReceiptLine
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined>;

  // User-Company Permissions
  getUserPermissions(userId: string): Promise<UserCompanyPermission[]>;
  getUserPermissionForCompany(userId: string, companyId: string): Promise<UserCompanyPermission | undefined>;
  setUserPermission(permission: InsertUserCompanyPermission): Promise<UserCompanyPermission>;
  deleteUserPermission(userId: string, companyId: string): Promise<boolean>;
  getUsersForCompany(companyId: string): Promise<Array<{ user: User; permission: UserCompanyPermission }>>;

  // Companies
  getCompanies(): Promise<Company[]>;
  getCompaniesForUser(userId: string): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;
  getDefaultCompanyId(): Promise<string>;

  // Transactions
  getTransactions(companyId: string, filter?: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Transaction[]>;
  getTransaction(id: string, companyId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, companyId: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string, companyId: string): Promise<boolean>;

  // Inventory
  getInventory(companyId: string): Promise<Inventory[]>;
  getInventoryItem(id: string, companyId: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, companyId: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string, companyId: string): Promise<boolean>;

  // Clients
  getClients(companyId: string): Promise<Client[]>;
  getClient(id: string, companyId: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, companyId: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string, companyId: string): Promise<boolean>;

  // Suppliers
  getSuppliers(companyId: string): Promise<Supplier[]>;
  getSupplier(id: string, companyId: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, companyId: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string, companyId: string): Promise<boolean>;

  // Inventory movements
  getInventoryMovements(companyId: string, inventoryId?: string): Promise<InventoryMovement[]>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;

  // Categories
  getCategories(companyId: string, type?: 'income' | 'expense'): Promise<Category[]>;
  getCategory(id: string, companyId: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, companyId: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string, companyId: string): Promise<boolean>;

  // Product Categories
  getProductCategories(companyId: string): Promise<ProductCategory[]>;
  getProductCategory(id: string, companyId: string): Promise<ProductCategory | undefined>;
  createProductCategory(category: InsertProductCategory): Promise<ProductCategory>;
  updateProductCategory(id: string, companyId: string, category: Partial<InsertProductCategory>): Promise<ProductCategory | undefined>;
  deleteProductCategory(id: string, companyId: string): Promise<boolean>;

  // Document Categories
  getDocumentCategories(companyId: string): Promise<DocumentCategory[]>;
  getDocumentCategory(id: string, companyId: string): Promise<DocumentCategory | undefined>;
  createDocumentCategory(category: InsertDocumentCategory): Promise<DocumentCategory>;
  updateDocumentCategory(id: string, companyId: string, category: Partial<InsertDocumentCategory>): Promise<DocumentCategory | undefined>;
  deleteDocumentCategory(id: string, companyId: string): Promise<boolean>;

  // Documents
  getDocuments(companyId: string): Promise<Document[]>;
  getDocument(id: string, companyId: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, companyId: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string, companyId: string): Promise<boolean>;

  // Events
  getEvents(companyId: string): Promise<Event[]>;
  getEvent(id: string, companyId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, companyId: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string, companyId: string): Promise<boolean>;

  // Dashboard metrics
  getMetrics(companyId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }>;
  
  getMonthlyData(companyId: string): Promise<{
    month: string;
    income: number;
    expenses: number;
  }[]>;

  // Articles
  getArticles(companyId: string): Promise<Article[]>;
  getArticle(id: string, companyId: string): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: string, companyId: string, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: string, companyId: string): Promise<boolean>;

  // Delivery Notes
  getDeliveryNotes(companyId: string): Promise<DeliveryNote[]>;
  getDeliveryNote(id: string, companyId: string): Promise<DeliveryNote | undefined>;
  createDeliveryNote(deliveryNote: InsertDeliveryNote, lines: InsertDeliveryNoteLine[]): Promise<DeliveryNote>;
  updateDeliveryNote(id: string, companyId: string, deliveryNote: Partial<InsertDeliveryNote>): Promise<DeliveryNote | undefined>;
  deleteDeliveryNote(id: string, companyId: string): Promise<boolean>;
  getDeliveryNoteLines(deliveryNoteId: string): Promise<DeliveryNoteLine[]>;
  getNextDeliveryNoteNumber(companyId: string, series: string, year: number): Promise<number>;

  // Invoices
  getInvoices(companyId: string): Promise<Invoice[]>;
  getInvoice(id: string, companyId: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice, lines: InsertInvoiceLine[], vatBreakdown: InsertInvoiceVatBreakdown[]): Promise<Invoice>;
  updateInvoice(id: string, companyId: string, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string, companyId: string): Promise<boolean>;
  getInvoiceLines(invoiceId: string): Promise<InvoiceLine[]>;
  getInvoiceVatBreakdown(invoiceId: string): Promise<InvoiceVatBreakdown[]>;
  getNextInvoiceNumber(companyId: string, series: string, year: number): Promise<number>;
  updateInvoiceDocuments(id: string, companyId: string, pdfData: string | null, xmlData: string | null): Promise<Invoice | undefined>;

  // Agricultural Receipts
  getAgriculturalReceipts(companyId: string): Promise<AgriculturalReceipt[]>;
  getAgriculturalReceipt(id: string, companyId: string): Promise<AgriculturalReceipt | undefined>;
  createAgriculturalReceipt(receipt: InsertAgriculturalReceipt, lines: InsertAgriculturalReceiptLine[]): Promise<AgriculturalReceipt>;
  updateAgriculturalReceipt(id: string, companyId: string, receipt: Partial<InsertAgriculturalReceipt>): Promise<AgriculturalReceipt | undefined>;
  deleteAgriculturalReceipt(id: string, companyId: string): Promise<boolean>;
  getAgriculturalReceiptLines(receiptId: string): Promise<AgriculturalReceiptLine[]>;
  getNextAgriculturalReceiptNumber(companyId: string, series: string, year: number): Promise<number>;
  updateAgriculturalReceiptPdf(id: string, companyId: string, pdfData: string | null): Promise<AgriculturalReceipt | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private userPermissions: Map<string, UserCompanyPermission> = new Map();
  private companies: Map<string, Company> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private clients: Map<string, Client> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private inventoryMovements: Map<string, InventoryMovement> = new Map();
  private categories: Map<string, Category> = new Map();
  private productCategories: Map<string, ProductCategory> = new Map();
  private documentCategories: Map<string, DocumentCategory> = new Map();
  private documents: Map<string, Document> = new Map();
  private defaultCompanyId: string;

  constructor() {
    this.defaultCompanyId = this.initializeDefaultCompany();
    this.initializeDefaultCategories(this.defaultCompanyId);
  }

  private initializeDefaultCompany(): string {
    const id = randomUUID();
    const defaultCompany: Company = {
      id,
      name: 'Mi Organización',
      taxId: null,
      address: null,
      town: null,
      province: null,
      postalCode: null,
      phone: null,
      email: null,
      logoImage: null,
      logoFileName: null,
      bankAccount: null,
      website: null,
      reagpAgricolaRate: null,
      reagpGanaderoRate: null,
      reagpForestalRate: null,
      isActive: true,
      createdAt: new Date(),
    };
    this.companies.set(id, defaultCompany);
    return id;
  }

  private initializeDefaultCategories(companyId: string) {
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

    defaultIncomeCategories.forEach(name => {
      const id = randomUUID();
      this.categories.set(id, {
        id,
        companyId,
        name,
        type: 'income',
        isActive: true,
        createdAt: new Date(),
      });
    });

    defaultExpenseCategories.forEach(name => {
      const id = randomUUID();
      this.categories.set(id, {
        id,
        companyId,
        name,
        type: 'expense',
        isActive: true,
        createdAt: new Date(),
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      isAdmin: existing?.isAdmin ?? false,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) => {
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || a.id;
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.email || b.id;
      return nameA.localeCompare(nameB);
    });
  }

  async updateUserAdmin(userId: string, isAdmin: boolean): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    user.isAdmin = isAdmin;
    user.updatedAt = new Date();
    this.users.set(userId, user);
    return user;
  }

  // User-Company Permissions
  async getUserPermissions(userId: string): Promise<UserCompanyPermission[]> {
    return Array.from(this.userPermissions.values())
      .filter(p => p.userId === userId);
  }

  async getUserPermissionForCompany(userId: string, companyId: string): Promise<UserCompanyPermission | undefined> {
    return Array.from(this.userPermissions.values())
      .find(p => p.userId === userId && p.companyId === companyId);
  }

  async setUserPermission(permission: InsertUserCompanyPermission): Promise<UserCompanyPermission> {
    const existing = await this.getUserPermissionForCompany(permission.userId, permission.companyId);
    
    if (existing) {
      const updated: UserCompanyPermission = {
        ...existing,
        role: permission.role,
      };
      this.userPermissions.set(existing.id, updated);
      return updated;
    }
    
    const id = randomUUID();
    const newPermission: UserCompanyPermission = {
      id,
      userId: permission.userId,
      companyId: permission.companyId,
      role: permission.role,
      createdAt: new Date(),
    };
    this.userPermissions.set(id, newPermission);
    return newPermission;
  }

  async deleteUserPermission(userId: string, companyId: string): Promise<boolean> {
    const permission = await this.getUserPermissionForCompany(userId, companyId);
    if (permission) {
      return this.userPermissions.delete(permission.id);
    }
    return false;
  }

  async getUsersForCompany(companyId: string): Promise<Array<{ user: User; permission: UserCompanyPermission }>> {
    const permissions = Array.from(this.userPermissions.values())
      .filter(p => p.companyId === companyId);
    
    const result = [];
    for (const permission of permissions) {
      const user = this.users.get(permission.userId);
      if (user) {
        result.push({ user, permission });
      }
    }
    return result;
  }

  // Companies
  async getCompaniesForUser(userId: string): Promise<Company[]> {
    const user = this.users.get(userId);
    if (user?.isAdmin) {
      return this.getCompanies();
    }
    
    const permissions = await this.getUserPermissions(userId);
    const companyIds = permissions.map(p => p.companyId);
    
    return Array.from(this.companies.values())
      .filter(c => companyIds.includes(c.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Companies
  async getCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();
    const company: Company = {
      ...insertCompany,
      taxId: insertCompany.taxId || null,
      address: insertCompany.address || null,
      phone: insertCompany.phone || null,
      email: insertCompany.email || null,
      isActive: insertCompany.isActive ?? true,
      id,
      createdAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, update: Partial<InsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updated = { ...company, ...update };
    this.companies.set(id, updated);
    return updated;
  }

  async deleteCompany(id: string): Promise<boolean> {
    return this.companies.delete(id);
  }

  async getDefaultCompanyId(): Promise<string> {
    return this.defaultCompanyId;
  }

  // Transactions
  async getTransactions(companyId: string, filter?: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values())
      .filter(t => t.companyId === companyId);
    
    if (filter) {
      if (filter.type && filter.type !== 'all') {
        transactions = transactions.filter(t => t.type === filter.type);
      }
      if (filter.category) {
        transactions = transactions.filter(t => t.category === filter.category);
      }
      if (filter.dateFrom) {
        transactions = transactions.filter(t => new Date(t.date) >= new Date(filter.dateFrom!));
      }
      if (filter.dateTo) {
        transactions = transactions.filter(t => new Date(t.date) <= new Date(filter.dateTo!));
      }
      if (filter.search) {
        const search = filter.search.toLowerCase();
        transactions = transactions.filter(t => 
          t.concept.toLowerCase().includes(search) ||
          t.amount.toString().includes(search) ||
          (t.notes && t.notes.toLowerCase().includes(search))
        );
      }
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransaction(id: string, companyId: string): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (transaction && transaction.companyId === companyId) {
      return transaction;
    }
    return undefined;
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const companyId = insertTransaction.companyId || this.defaultCompanyId;
    const transaction: Transaction = {
      ...insertTransaction,
      companyId,
      quantity: insertTransaction.quantity || null,
      clientSupplierId: insertTransaction.clientSupplierId || null,
      notes: insertTransaction.notes || null,
      pdfDocument: insertTransaction.pdfDocument || null,
      pdfFileName: insertTransaction.pdfFileName || null,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    
    // Update client/supplier totals if applicable
    if (insertTransaction.clientSupplierId) {
      if (insertTransaction.type === 'income') {
        const client = this.clients.get(insertTransaction.clientSupplierId);
        if (client && client.totalPurchases !== null && client.orderCount !== null) {
          client.totalPurchases = (parseFloat(client.totalPurchases) + parseFloat(insertTransaction.amount)).toString();
          client.orderCount += 1;
          this.clients.set(client.id, client);
        }
      } else {
        const supplier = this.suppliers.get(insertTransaction.clientSupplierId);
        if (supplier && supplier.totalPurchases !== null && supplier.orderCount !== null) {
          supplier.totalPurchases = (parseFloat(supplier.totalPurchases) + parseFloat(insertTransaction.amount)).toString();
          supplier.orderCount += 1;
          this.suppliers.set(supplier.id, supplier);
        }
      }
    }
    
    return transaction;
  }

  async updateTransaction(id: string, companyId: string, update: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction || transaction.companyId !== companyId) return undefined;
    
    const updated = { ...transaction, ...update };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string, companyId: string): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (transaction && transaction.companyId === companyId) {
      return this.transactions.delete(id);
    }
    return false;
  }

  // Inventory
  async getInventory(companyId: string): Promise<Inventory[]> {
    return Array.from(this.inventory.values())
      .filter(i => i.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getInventoryItem(id: string, companyId: string): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (item && item.companyId === companyId) {
      return item;
    }
    return undefined;
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const companyId = insertItem.companyId || this.defaultCompanyId;
    const item: Inventory = {
      ...insertItem,
      companyId,
      minStock: insertItem.minStock || null,
      pricePerUnit: insertItem.pricePerUnit || null,
      id,
      lastUpdated: new Date(),
    };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, companyId: string, update: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item || item.companyId !== companyId) return undefined;
    
    const updated = { ...item, ...update, lastUpdated: new Date() };
    this.inventory.set(id, updated);
    return updated;
  }

  async deleteInventoryItem(id: string, companyId: string): Promise<boolean> {
    const item = this.inventory.get(id);
    if (item && item.companyId === companyId) {
      return this.inventory.delete(id);
    }
    return false;
  }

  // Clients
  async getClients(companyId: string): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(c => c.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClient(id: string, companyId: string): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (client && client.companyId === companyId) {
      return client;
    }
    return undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const companyId = insertClient.companyId || this.defaultCompanyId;
    const client: Client = {
      ...insertClient,
      companyId,
      address: insertClient.address || null,
      email: insertClient.email || null,
      phone: insertClient.phone || null,
      contactPerson: insertClient.contactPerson || null,
      isActive: insertClient.isActive ?? null,
      id,
      totalPurchases: "0",
      orderCount: 0,
      createdAt: new Date(),
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, companyId: string, update: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client || client.companyId !== companyId) return undefined;
    
    const updated = { ...client, ...update };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string, companyId: string): Promise<boolean> {
    const client = this.clients.get(id);
    if (client && client.companyId === companyId) {
      return this.clients.delete(id);
    }
    return false;
  }

  // Suppliers
  async getSuppliers(companyId: string): Promise<Supplier[]> {
    return Array.from(this.suppliers.values())
      .filter(s => s.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getSupplier(id: string, companyId: string): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (supplier && supplier.companyId === companyId) {
      return supplier;
    }
    return undefined;
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const companyId = insertSupplier.companyId || this.defaultCompanyId;
    const supplier: Supplier = {
      ...insertSupplier,
      companyId,
      address: insertSupplier.address || null,
      town: insertSupplier.town || null,
      province: insertSupplier.province || null,
      postalCode: insertSupplier.postalCode || null,
      email: insertSupplier.email || null,
      phone: insertSupplier.phone || null,
      contactPerson: insertSupplier.contactPerson || null,
      isReagp: insertSupplier.isReagp ?? false,
      isActive: insertSupplier.isActive ?? null,
      id,
      totalPurchases: "0",
      orderCount: 0,
      createdAt: new Date(),
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: string, companyId: string, update: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier || supplier.companyId !== companyId) return undefined;
    
    const updated = { ...supplier, ...update };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string, companyId: string): Promise<boolean> {
    const supplier = this.suppliers.get(id);
    if (supplier && supplier.companyId === companyId) {
      return this.suppliers.delete(id);
    }
    return false;
  }

  // Inventory movements
  async getInventoryMovements(companyId: string, inventoryId?: string): Promise<InventoryMovement[]> {
    let movements = Array.from(this.inventoryMovements.values())
      .filter(m => m.companyId === companyId);
    if (inventoryId) {
      movements = movements.filter(m => m.inventoryId === inventoryId);
    }
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    const id = randomUUID();
    const companyId = insertMovement.companyId || this.defaultCompanyId;
    const movement: InventoryMovement = {
      ...insertMovement,
      companyId,
      notes: insertMovement.notes || null,
      transactionId: insertMovement.transactionId || null,
      id,
      date: new Date(),
    };
    this.inventoryMovements.set(id, movement);
    
    // Update inventory stock
    const item = this.inventory.get(insertMovement.inventoryId);
    if (item) {
      const currentStock = parseFloat(item.currentStock);
      const quantity = parseFloat(insertMovement.quantity);
      const newStock = insertMovement.type === 'in' ? currentStock + quantity : currentStock - quantity;
      item.currentStock = Math.max(0, newStock).toString();
      item.lastUpdated = new Date();
      this.inventory.set(item.id, item);
    }
    
    return movement;
  }

  // Categories
  async getCategories(companyId: string, type?: 'income' | 'expense'): Promise<Category[]> {
    let categories = Array.from(this.categories.values())
      .filter(c => c.companyId === companyId);
    if (type) {
      categories = categories.filter(c => c.type === type);
    }
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCategory(id: string, companyId: string): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (category && category.companyId === companyId) {
      return category;
    }
    return undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const companyId = insertCategory.companyId || this.defaultCompanyId;
    const category: Category = {
      ...insertCategory,
      companyId,
      isActive: insertCategory.isActive ?? true,
      id,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, companyId: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category || category.companyId !== companyId) return undefined;
    
    const updated = { ...category, ...update };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string, companyId: string): Promise<boolean> {
    const category = this.categories.get(id);
    if (category && category.companyId === companyId) {
      return this.categories.delete(id);
    }
    return false;
  }

  // Product Categories
  async getProductCategories(companyId: string): Promise<ProductCategory[]> {
    return Array.from(this.productCategories.values())
      .filter(c => c.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getProductCategory(id: string, companyId: string): Promise<ProductCategory | undefined> {
    const category = this.productCategories.get(id);
    if (category && category.companyId === companyId) {
      return category;
    }
    return undefined;
  }

  async createProductCategory(insertCategory: InsertProductCategory): Promise<ProductCategory> {
    const id = randomUUID();
    const companyId = insertCategory.companyId || this.defaultCompanyId;
    const category: ProductCategory = {
      ...insertCategory,
      companyId,
      isActive: insertCategory.isActive ?? true,
      id,
      createdAt: new Date(),
    };
    this.productCategories.set(id, category);
    return category;
  }

  async updateProductCategory(id: string, companyId: string, update: Partial<InsertProductCategory>): Promise<ProductCategory | undefined> {
    const category = this.productCategories.get(id);
    if (!category || category.companyId !== companyId) return undefined;
    
    const updated = { ...category, ...update };
    this.productCategories.set(id, updated);
    return updated;
  }

  async deleteProductCategory(id: string, companyId: string): Promise<boolean> {
    const category = this.productCategories.get(id);
    if (category && category.companyId === companyId) {
      return this.productCategories.delete(id);
    }
    return false;
  }

  // Document Categories
  async getDocumentCategories(companyId: string): Promise<DocumentCategory[]> {
    return Array.from(this.documentCategories.values())
      .filter(c => c.companyId === companyId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async getDocumentCategory(id: string, companyId: string): Promise<DocumentCategory | undefined> {
    const category = this.documentCategories.get(id);
    if (category && category.companyId === companyId) {
      return category;
    }
    return undefined;
  }

  async createDocumentCategory(insertCategory: InsertDocumentCategory): Promise<DocumentCategory> {
    const id = randomUUID();
    const companyId = insertCategory.companyId || this.defaultCompanyId;
    const category: DocumentCategory = {
      ...insertCategory,
      companyId,
      isActive: insertCategory.isActive ?? true,
      id,
      createdAt: new Date(),
    };
    this.documentCategories.set(id, category);
    return category;
  }

  async updateDocumentCategory(id: string, companyId: string, update: Partial<InsertDocumentCategory>): Promise<DocumentCategory | undefined> {
    const category = this.documentCategories.get(id);
    if (!category || category.companyId !== companyId) return undefined;
    
    const updated = { ...category, ...update };
    this.documentCategories.set(id, updated);
    return updated;
  }

  async deleteDocumentCategory(id: string, companyId: string): Promise<boolean> {
    const category = this.documentCategories.get(id);
    if (category && category.companyId === companyId) {
      return this.documentCategories.delete(id);
    }
    return false;
  }

  // Documents
  async getDocuments(companyId: string): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(d => d.companyId === companyId)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }

  async getDocument(id: string, companyId: string): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (document && document.companyId === companyId) {
      return document;
    }
    return undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const companyId = insertDocument.companyId || this.defaultCompanyId;
    const document: Document = {
      ...insertDocument,
      companyId,
      categoryId: insertDocument.categoryId || null,
      description: insertDocument.description || null,
      pdfData: insertDocument.pdfData || null,
      pdfFileName: insertDocument.pdfFileName || null,
      id,
      createdAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, companyId: string, update: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document || document.companyId !== companyId) return undefined;
    
    const updated = { ...document, ...update };
    this.documents.set(id, updated);
    return updated;
  }

  async deleteDocument(id: string, companyId: string): Promise<boolean> {
    const document = this.documents.get(id);
    if (document && document.companyId === companyId) {
      return this.documents.delete(id);
    }
    return false;
  }

  // Dashboard metrics
  async getMetrics(companyId: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }> {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = Array.from(this.transactions.values())
      .filter(t => t.companyId === companyId)
      .filter(t => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    
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
      pendingPayments: totalIncome * 0.15, // Mock pending payments as 15% of income
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
      const monthlyTransactions = Array.from(this.transactions.values())
        .filter(t => t.companyId === companyId)
        .filter(t => {
          const date = new Date(t.date);
          return date.getMonth() === month && date.getFullYear() === currentYear;
        });
      
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

  // Agricultural Receipts (stubs)
  async getAgriculturalReceipts(companyId: string): Promise<AgriculturalReceipt[]> {
    throw new Error("Not implemented");
  }

  async getAgriculturalReceipt(id: string, companyId: string): Promise<AgriculturalReceipt | undefined> {
    throw new Error("Not implemented");
  }

  async createAgriculturalReceipt(receipt: InsertAgriculturalReceipt, lines: InsertAgriculturalReceiptLine[]): Promise<AgriculturalReceipt> {
    throw new Error("Not implemented");
  }

  async updateAgriculturalReceipt(id: string, companyId: string, receipt: Partial<InsertAgriculturalReceipt>): Promise<AgriculturalReceipt | undefined> {
    throw new Error("Not implemented");
  }

  async deleteAgriculturalReceipt(id: string, companyId: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async getAgriculturalReceiptLines(receiptId: string): Promise<AgriculturalReceiptLine[]> {
    throw new Error("Not implemented");
  }

  async getNextAgriculturalReceiptNumber(companyId: string, series: string, year: number): Promise<number> {
    throw new Error("Not implemented");
  }

  async updateAgriculturalReceiptPdf(id: string, companyId: string, pdfData: string | null): Promise<AgriculturalReceipt | undefined> {
    throw new Error("Not implemented");
  }
}

import { PostgresStorage } from './pg-storage';

export const storage = new PostgresStorage();
