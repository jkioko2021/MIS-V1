import { boolean, check, integer, numeric, pgSchema, text, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

export const riskLikelihoodFactors = pgSchema("risk").table("likelihood_factors", {
  likelihoodCode: varchar("likelihood_code", { length: 20 }).primaryKey(),
  likelihoodFactor: varchar("likelihood_factor", { length: 50 }).notNull(),
  qualificationCriteria: text("qualification_criteria").notNull(),
  rating: numeric("rating", { precision: 8, scale: 6 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  matrixWeight: integer("matrix_weight"),
}, table => [
  check("likelihood_factors_rating_check", sql`${table.rating}>0 AND ${table.rating}<=1`),
  check("likelihood_factors_matrix_weight_check", sql`${table.matrixWeight} BETWEEN 1 AND 5`),
]);
export const insertRiskLikelihoodFactorSchema = createInsertSchema(riskLikelihoodFactors);
export type RiskLikelihoodFactorRow = typeof riskLikelihoodFactors.$inferSelect;
export type InsertRiskLikelihoodFactor = typeof riskLikelihoodFactors.$inferInsert;
