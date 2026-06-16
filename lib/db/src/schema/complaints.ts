import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const complaintsTable = pgTable("complaints", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  category: text("category"),
  details: text("details"),
  testId: text("test_id"),
  date: timestamp("date", { withTimezone: true }),
  status: text("status").default("pending"),
  adminReply: text("admin_reply"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({ createdAt: true });
export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
