import { boolean, check, integer, numeric, pgSchema, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const riskImpactFactors = pgSchema("risk").table("impact_factors", {
  impactCode: varchar("impact_code", { length: 20 }).primaryKey(),
  impactFactor: varchar("impact_factor", { length: 50 }).notNull(),
  rateFactor: numeric("rate_factor", { precision: 8, scale: 2 }).notNull(),
  rate: varchar("rate", { length: 50 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  matrixWeight: integer("matrix_weight"),
}, table => [
  check("impact_factors_rate_factor_check", sql`${table.rateFactor}>0 AND ${table.rateFactor}<=100`),
  check("impact_factors_matrix_weight_check", sql`${table.matrixWeight} BETWEEN 1 AND 5`),
]);
export const insertRiskImpactFactorSchema = createInsertSchema(riskImpactFactors);
export type RiskImpactFactorRow = typeof riskImpactFactors.$inferSelect;
export type InsertRiskImpactFactor = typeof riskImpactFactors.$inferInsert;
