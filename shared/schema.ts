import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, index, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User-Company permissions table
export const userCompanyPermissions = pgTable("user_company_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  companyId: varchar("company_id").notNull(),
  role: text("role").notNull(), // 'consulta' | 'administracion'
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("unique_user_company").on(table.userId, table.companyId),
]);

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  taxId: text("tax_id"), // NIF, CIF, Tax ID, etc.
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  date: timestamp("date").notNull(),
  concept: text("concept").notNull(),
  category: text("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  quantity: text("quantity"), // Optional, e.g. "2500 kg"
  clientSupplierId: varchar("client_supplier_id"), // Reference to client or supplier
  notes: text("notes"),
  pdfDocument: text("pdf_document"), // Optional PDF document stored as base64
  pdfFileName: text("pdf_file_name"), // Original filename of the PDF
  invoiceId: varchar("invoice_id"), // Link to invoice if auto-generated from invoice
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  categoryId: varchar("category_id"),
  location: text("location"), // Optional location/placement of the object
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // Value in euros
  idContenedor: text("id_contenedor"), // Container ID
  pdfDocument: text("pdf_document"), // Optional PDF document stored as base64
  pdfFileName: text("pdf_file_name"), // Original filename of the PDF
  imageDocument: text("image_document"), // Optional image stored as base64
  imageFileName: text("image_file_name"), // Original filename of the image
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  idFiscal: varchar("id_fiscal", { length: 10 }),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  totalPurchases: decimal("total_purchases", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  idFiscal: varchar("id_fiscal", { length: 10 }),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  category: text("category").notNull(), // e.g. 'materials', 'supplies', 'equipment'
  totalPurchases: decimal("total_purchases", { precision: 10, scale: 2 }).default("0"),
  orderCount: integer("order_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  inventoryId: varchar("inventory_id").notNull(),
  type: text("type").notNull(), // 'in' | 'out'
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  reason: text("reason").notNull(), // e.g. 'sale', 'purchase', 'waste', 'adjustment'
  transactionId: varchar("transaction_id"), // Optional link to transaction
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productCategories = pgTable("product_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentCategories = pgTable("document_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  categoryId: varchar("category_id"),
  title: text("title").notNull(),
  description: text("description"),
  pdfData: text("pdf_data"), // PDF file stored as base64
  pdfFileName: text("pdf_file_name"), // Original filename
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Articles/Products table for invoicing
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  code: varchar("code", { length: 50 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("21.00"),
  unitOfMeasure: text("unit_of_measure").default("unidad"),
  categoryId: varchar("category_id"),
  stock: decimal("stock", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Delivery Notes (Albaranes)
export const deliveryNotes = pgTable("delivery_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  series: varchar("series", { length: 10 }).default("ALB"),
  number: integer("number").notNull(),
  date: timestamp("date").notNull(),
  clientId: varchar("client_id").notNull(),
  notes: text("notes"),
  status: text("status").default("pending").notNull(),
  invoiceId: varchar("invoice_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Delivery Note Lines
export const deliveryNoteLines = pgTable("delivery_note_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deliveryNoteId: varchar("delivery_note_id").notNull(),
  articleId: varchar("article_id"),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull(),
  lineOrder: integer("line_order").default(0),
});

// Invoices (Facturas)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  series: varchar("series", { length: 10 }).default("FAC"),
  number: integer("number").notNull(),
  date: timestamp("date").notNull(),
  dueDate: timestamp("due_date"),
  clientId: varchar("client_id").notNull(),
  clientName: text("client_name").notNull(),
  clientIdFiscal: varchar("client_id_fiscal", { length: 20 }),
  clientAddress: text("client_address"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  totalVat: decimal("total_vat", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").default("transferencia"),
  paymentTerms: text("payment_terms"),
  iban: varchar("iban", { length: 34 }),
  notes: text("notes"),
  status: text("status").default("draft").notNull(),
  transactionId: varchar("transaction_id"), // Link to auto-generated income transaction
  incomeCategory: text("income_category").default("Ventas"), // Category for the income transaction
  pdfData: text("pdf_data"),
  xmlData: text("xml_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoice Lines
export const invoiceLines = pgTable("invoice_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  articleId: varchar("article_id"),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  lineOrder: integer("line_order").default(0),
});

// Invoice VAT Breakdown
export const invoiceVatBreakdown = pgTable("invoice_vat_breakdown", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull(),
  taxableBase: decimal("taxable_base", { precision: 10, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).notNull(),
});

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
  date: z.union([z.date(), z.string().transform(val => new Date(val))]),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  totalPurchases: true,
  orderCount: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  totalPurchases: true,
  orderCount: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  date: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertProductCategorySchema = createInsertSchema(productCategories).omit({
  id: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertDocumentCategorySchema = createInsertSchema(documentCategories).omit({
  id: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
}).extend({
  companyId: z.string().optional(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  isRead: true,
}).extend({
  companyId: z.string().optional(),
  date: z.coerce.date(),
});

// Article schemas
export const insertArticleSchema = createInsertSchema(articles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  companyId: z.string().optional(),
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatRate: z.union([z.string(), z.number()]).transform(val => String(val)).default("21.00"),
  stock: z.union([z.string(), z.number(), z.null()]).transform(val => val === null ? null : String(val)).optional(),
});

// Delivery Note schemas
export const insertDeliveryNoteSchema = createInsertSchema(deliveryNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  invoiceId: true,
}).extend({
  companyId: z.string().optional(),
  date: z.coerce.date(),
  status: z.enum(["pending", "invoiced"]).default("pending"),
});

export const insertDeliveryNoteLineSchema = createInsertSchema(deliveryNoteLines).omit({
  id: true,
}).extend({
  quantity: z.union([z.string(), z.number()]).transform(val => String(val)),
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatRate: z.union([z.string(), z.number()]).transform(val => String(val)),
});

// Invoice schemas
export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  pdfData: true,
  xmlData: true,
  transactionId: true,
}).extend({
  companyId: z.string().optional(),
  date: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  subtotal: z.union([z.string(), z.number()]).transform(val => String(val)),
  totalVat: z.union([z.string(), z.number()]).transform(val => String(val)),
  total: z.union([z.string(), z.number()]).transform(val => String(val)),
  status: z.enum(["draft", "issued", "paid", "cancelled"]).default("draft"),
  incomeCategory: z.string().default("Ventas"),
});

export const insertInvoiceLineSchema = createInsertSchema(invoiceLines).omit({
  id: true,
}).extend({
  quantity: z.union([z.string(), z.number()]).transform(val => String(val)),
  unitPrice: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatRate: z.union([z.string(), z.number()]).transform(val => String(val)),
  subtotal: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
  total: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertInvoiceVatBreakdownSchema = createInsertSchema(invoiceVatBreakdown).omit({
  id: true,
}).extend({
  vatRate: z.union([z.string(), z.number()]).transform(val => String(val)),
  taxableBase: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatAmount: z.union([z.string(), z.number()]).transform(val => String(val)),
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type ProductCategory = typeof productCategories.$inferSelect;
export type InsertProductCategory = z.infer<typeof insertProductCategorySchema>;

export type DocumentCategory = typeof documentCategories.$inferSelect;
export type InsertDocumentCategory = z.infer<typeof insertDocumentCategorySchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

// Article types
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;

// Delivery Note types
export type DeliveryNote = typeof deliveryNotes.$inferSelect;
export type InsertDeliveryNote = z.infer<typeof insertDeliveryNoteSchema>;
export type DeliveryNoteLine = typeof deliveryNoteLines.$inferSelect;
export type InsertDeliveryNoteLine = z.infer<typeof insertDeliveryNoteLineSchema>;

// Invoice types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InsertInvoiceLine = z.infer<typeof insertInvoiceLineSchema>;
export type InvoiceVatBreakdown = typeof invoiceVatBreakdown.$inferSelect;
export type InsertInvoiceVatBreakdown = z.infer<typeof insertInvoiceVatBreakdownSchema>;

// User schemas
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Permission schemas
export const insertUserCompanyPermissionSchema = createInsertSchema(userCompanyPermissions).omit({
  id: true,
  createdAt: true,
}).extend({
  role: z.enum(['consulta', 'administracion']),
});

export type UserCompanyPermission = typeof userCompanyPermissions.$inferSelect;
export type InsertUserCompanyPermission = z.infer<typeof insertUserCompanyPermissionSchema>;

// Additional schemas for forms
export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  type: z.enum(['all', 'income', 'expense']).default('all'),
  category: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;
