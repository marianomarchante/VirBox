import { 
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
  type InsertCategory
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transactions
  getTransactions(filter?: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Partial<InsertTransaction>): Promise<Transaction | undefined>;
  deleteTransaction(id: string): Promise<boolean>;

  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;

  // Inventory movements
  getInventoryMovements(inventoryId?: string): Promise<InventoryMovement[]>;
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;

  // Categories
  getCategories(type?: 'income' | 'expense'): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Dashboard metrics
  getMetrics(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }>;
  
  getMonthlyData(): Promise<{
    month: string;
    income: number;
    expenses: number;
  }[]>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private clients: Map<string, Client> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private inventoryMovements: Map<string, InventoryMovement> = new Map();
  private categories: Map<string, Category> = new Map();

  constructor() {
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultIncomeCategories = [
      'Ventas - Productos',
      'Servicios',
      'Otros Ingresos',
    ];

    const defaultExpenseCategories = [
      'Semillas',
      'Fertilizantes',
      'Mano de Obra',
      'Maquinaria',
      'Infraestructura',
      'Servicios',
      'Otros Gastos',
    ];

    defaultIncomeCategories.forEach(name => {
      const id = randomUUID();
      this.categories.set(id, {
        id,
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
        name,
        type: 'expense',
        isActive: true,
        createdAt: new Date(),
      });
    });
  }

  // Transactions
  async getTransactions(filter?: {
    type?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());
    
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

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
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

  async updateTransaction(id: string, update: Partial<InsertTransaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;
    
    const updated = { ...transaction, ...update };
    this.transactions.set(id, updated);
    return updated;
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactions.delete(id);
  }

  // Inventory
  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const item: Inventory = {
      ...insertItem,
      minStock: insertItem.minStock || null,
      pricePerUnit: insertItem.pricePerUnit || null,
      id,
      lastUpdated: new Date(),
    };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, update: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    
    const updated = { ...item, ...update, lastUpdated: new Date() };
    this.inventory.set(id, updated);
    return updated;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventory.delete(id);
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      ...insertClient,
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

  async updateClient(id: string, update: Partial<InsertClient>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updated = { ...client, ...update };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier: Supplier = {
      ...insertSupplier,
      address: insertSupplier.address || null,
      email: insertSupplier.email || null,
      phone: insertSupplier.phone || null,
      contactPerson: insertSupplier.contactPerson || null,
      isActive: insertSupplier.isActive ?? null,
      id,
      totalPurchases: "0",
      orderCount: 0,
      createdAt: new Date(),
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: string, update: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    
    const updated = { ...supplier, ...update };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Inventory movements
  async getInventoryMovements(inventoryId?: string): Promise<InventoryMovement[]> {
    let movements = Array.from(this.inventoryMovements.values());
    if (inventoryId) {
      movements = movements.filter(m => m.inventoryId === inventoryId);
    }
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    const id = randomUUID();
    const movement: InventoryMovement = {
      ...insertMovement,
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
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    let categories = Array.from(this.categories.values());
    if (type) {
      categories = categories.filter(c => c.type === type);
    }
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = {
      ...insertCategory,
      isActive: insertCategory.isActive ?? true,
      id,
      createdAt: new Date(),
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, update: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updated = { ...category, ...update };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Dashboard metrics
  async getMetrics(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }> {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = Array.from(this.transactions.values()).filter(t => {
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

  async getMonthlyData(): Promise<{
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
      const monthlyTransactions = Array.from(this.transactions.values()).filter(t => {
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
}

export const storage = new MemStorage();
