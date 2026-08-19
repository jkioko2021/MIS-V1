import { boolean, pgSchema, timestamp, varchar } from "drizzle-orm/pg-core";

const crm = pgSchema("crm");

export const businessSectors = crm.table("business_sectors", {
  sectorName: varchar("sector_name", { length: 120 }).primaryKey(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});