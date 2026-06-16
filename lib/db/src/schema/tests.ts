import { pgTable, text, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { patientsTable } from "./patients";

export const testsTable = pgTable("tests", {
  id: text("id").primaryKey(),
  patientId: text("patient_id").references(() => patientsTable.id),
  patientName: text("patient_name"),
  patientNameEn: text("patient_name_en"),
  testType: text("test_type"),
  titleAr: text("title_ar"),
  titleEn: text("title_en"),
  requestDate: timestamp("request_date", { withTimezone: true }),
  sampleStatus: text("sample_status"),
  parameters: jsonb("parameters"),
  cost: numeric("cost"),
  paidAmount: numeric("paid_amount"),
  discountPercent: numeric("discount_percent"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  barcode: text("barcode"),
  qrToken: text("qr_token"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertTestSchema = createInsertSchema(testsTable).omit({ createdAt: true });
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof testsTable.$inferSelect;
