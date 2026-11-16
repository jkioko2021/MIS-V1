import { sql } from "drizzle-orm";
import { check, boolean, integer, jsonb, pgSchema, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { dataImportBatches } from "./data-import-batches";
export const relationshipManagers = pgSchema("crm").table("relationship_managers", {
  reCode: varchar("re_code", { length: 32 }).notNull(),
  reName: varchar("re_name", { length: 200 }).notNull(),
  classCode: varchar("class_code", { length: 50 }).notNull(),
  cCode: varchar("c_code", { length: 1 }).notNull(),
  reportingYear: integer("reporting_year").notNull(),
  isActive: boolean("is_active").notNull(),
  version: integer("version").notNull().default(1),
  sourceBatchId: uuid("source_batch_id").references(() => dataImportBatches.id),
  sourceData: jsonb("source_data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by").notNull(),
}, table => [
  primaryKey({ columns: [table.reCode, table.cCode, table.reportingYear] }),
  check("relationship_managers_c_code_check", sql`${table.cCode} IN ('C','R')`),
  check("relationship_managers_reporting_year_check", sql`${table.reportingYear} BETWEEN 1900 AND 2100`),
]);
export const insertRelationshipManagerSchema = createInsertSchema(relationshipManagers);
