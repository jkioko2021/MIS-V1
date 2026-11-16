import { sql } from "drizzle-orm";
import { check, index, jsonb, pgSchema, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const dataImportBatches = pgSchema("crm").table("data_import_batches", {
  id: uuid("id").primaryKey(),
  kind: text("kind").notNull(),
  filename: varchar("filename", { length: 200 }).notNull(),
  digest: text("digest").notNull(),
  status: text("status").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  importedBy: text("imported_by"),
  importedAt: timestamp("imported_at", { withTimezone: true }),
  records: jsonb("records").notNull(),
  results: jsonb("results").notNull(),
  summary: jsonb("summary").notNull(),
}, table => [
  check("data_import_batches_kind_check", sql`${table.kind} IN ('users','agents','relationship-managers')`),
  check("data_import_batches_status_check", sql`${table.status} IN ('VALIDATED','BLOCKED','IMPORTED')`),
  index("data_import_batches_recent").on(table.kind, table.createdAt.desc()),
  uniqueIndex("data_import_batches_committed").on(table.kind, table.digest).where(sql`${table.status}='IMPORTED'`),
]);
export const insertDataImportBatchSchema = createInsertSchema(dataImportBatches);
export type DataImportBatchRecord = typeof dataImportBatches.$inferSelect;
