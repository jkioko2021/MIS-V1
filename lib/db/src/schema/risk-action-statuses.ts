import { boolean, pgSchema, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const risk = pgSchema("risk");
export const riskActionStatuses = risk.table("action_statuses", {
  statusCode: varchar("status_code", { length: 20 }).primaryKey(),
  statusName: varchar("status_name", { length: 50 }).notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});
export const insertRiskActionStatusSchema = createInsertSchema(riskActionStatuses);
export type InsertRiskActionStatus = z.infer<typeof insertRiskActionStatusSchema>;
export type RiskActionStatusRow = typeof riskActionStatuses.$inferSelect;
