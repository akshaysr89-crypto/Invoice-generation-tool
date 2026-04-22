import {
  pgTable,
  serial,
  text,
  numeric,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoicesTable = pgTable("invoices", {
  id: serial("id").primaryKey(),
  vendorName: text("vendor_name").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  invoiceDate: text("invoice_date").notNull(),
  dueDate: text("due_date").notNull(),
  paymentTerms: text("payment_terms").notNull(),
  vendorHistory: text("vendor_history").notNull(),
  riskLevel: text("risk_level").notNull(),
  decision: text("decision").notNull(),
  riskFlags: jsonb("risk_flags").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
