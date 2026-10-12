import { integer, pgSchema, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

// Imported risk tables remain SQL-managed; their foreign keys are in the migration.
export const riskReviewNotifications = pgSchema("risk").table("review_notifications", {
  notificationId: serial("notification_id").primaryKey(),
  summaryId: integer("summary_id").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
  departCode: varchar("depart_code", { length: 30 }).notNull(),
  periodId: integer("period_id").notNull(),
  recipientUsername: varchar("recipient_username", { length: 100 }).notNull(),
  submittedBy: varchar("submitted_by", { length: 100 }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  emailStatus: varchar("email_status", { length: 30 }).notNull(),
  emailAttempts: integer("email_attempts").notNull().default(0),
  emailError: text("email_error"),
  emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true }).notNull().defaultNow(),
}, table => [unique("review_notifications_summary_id_submitted_at_key").on(table.summaryId,table.submittedAt)]);
