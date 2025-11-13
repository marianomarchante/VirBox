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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  name: text("name").notNull(),
  categoryId: varchar("category_id"),
  location: text("location"), // Optional location/placement of the object
  value: decimal("value", { precision: 10, scale: 2 }).notNull(), // Value in euros
  acquisitionDate: timestamp("acquisition_date").notNull(), // Date of acquisition
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  acquisitionDate: z.union([z.date(), z.string().transform(val => new Date(val))]),
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
}).extend({
  companyId: z.string().optional(),
  date: z.coerce.date(),
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
