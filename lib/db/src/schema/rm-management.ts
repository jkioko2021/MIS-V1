import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgSchema, bigserial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
const crm = pgSchema("crm");
export const rmManagementEvents = crm.table("rm_management_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  action: text("action").notNull(), actor: text("actor").notNull(), reason: text("reason").notNull(),
  description: text("description").notNull(), agentCode: varchar("agent_code", { length: 30 }),
  beforeData: jsonb("before_data"), afterData: jsonb("after_data"), batchId: uuid("batch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [index("rm_management_events_recent").on(table.createdAt.desc(), table.id.desc())]);
export const rmTransferPreviews = crm.table("rm_transfer_previews", {
  id: uuid("id").primaryKey(), createdBy: integer("created_by").notNull(),
  input: jsonb("input").notNull(), target: jsonb("target").notNull(), results: jsonb("results").notNull(),
  status: text("status").notNull().default("PREVIEW"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull().default(sql`now()+interval '15 minutes'`),
  committedAt: timestamp("committed_at", { withTimezone: true }),
}, table => [check("rm_transfer_previews_status_check", sql`${table.status} IN ('PREVIEW','COMMITTED')`)]);
export const insertRmManagementEventSchema = createInsertSchema(rmManagementEvents);
export const insertRmTransferPreviewSchema = createInsertSchema(rmTransferPreviews);
