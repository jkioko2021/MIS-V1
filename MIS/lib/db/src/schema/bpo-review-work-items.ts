import { sql } from "drizzle-orm";
import { check, foreignKey, index, pgSchema, serial, timestamp, unique, varchar } from "drizzle-orm/pg-core";

const crm = pgSchema("crm");

const businessTrackingFiles = crm.table("business_tracking", {
  fileNo: varchar("file_no", { length: 200 }).primaryKey(),
});

/**
 * An active BPO Review task points to the original business file. The business
 * file remains the source of truth for its client data, notes, documents, and
 * audit history.
 */
export const businessWorkItems = crm.table(
  "business_work_items",
  {
    workItemId: serial("work_item_id").primaryKey(),
    fileNo: varchar("file_no", { length: 200 }).notNull(),
    queueName: varchar("queue_name", { length: 50 }).notNull(),
    workStatus: varchar("work_status", { length: 20 }).notNull().default("OPEN"),
    assignedTo: varchar("assigned_to", { length: 200 }),
    assignedBy: varchar("assigned_by", { length: 200 }),
    forwardedBy: varchar("forwarded_by", { length: 200 }).notNull(),
    forwardedAt: timestamp("forwarded_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("business_work_items_file_queue_unique").on(table.fileNo, table.queueName),
    index("business_work_items_open_queue_idx").on(table.queueName, table.workStatus, table.forwardedAt),
    foreignKey({
      name: "business_work_items_file_no_fkey",
      columns: [table.fileNo],
      foreignColumns: [businessTrackingFiles.fileNo],
    }),
    check(
      "business_work_items_queue_name_check",
      sql`${table.queueName} IN (
        'BPO_REVIEW_RETAIL',
        'BPO_REVIEW_CORPORATE_SME',
        'REGISTER_CORRECTION',
        'MEDICAL_UNDERWRITING',
        'CASHIER',
        'MEMBERSHIP_CLOSURE',
        'IT_SUPPORT',
        'RELATIONSHIP_MANAGEMENT'
      )`,
    ),
    check("business_work_items_work_status_check", sql`${table.workStatus} IN ('OPEN', 'COMPLETED', 'CANCELLED')`),
  ],
);