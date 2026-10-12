import { boolean, check, numeric, pgSchema, text, varchar } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const riskControlEffectiveness = pgSchema("risk").table("control_effectiveness", {
  effFactor: varchar("eff_factor", { length: 50 }).primaryKey(),
  qualCriteria: text("qual_criteria").notNull(),
  rating: numeric("rating", { precision: 8, scale: 6 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
}, table => [check("risk_control_effectiveness_rating_range", sql`${table.rating} >= 0 AND ${table.rating} <= 1`)]);
export const insertRiskControlEffectivenessSchema = createInsertSchema(riskControlEffectiveness);
export type InsertRiskControlEffectiveness = z.infer<typeof insertRiskControlEffectivenessSchema>;
