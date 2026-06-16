import { pgTable, text, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patientsTable = pgTable("patients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  phone: text("phone"),
  gender: text("gender"),
  birthDate: date("birth_date", { mode: "string" }),
  bloodType: text("blood_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertPatientSchema = createInsertSchema(patientsTable).omit({ createdAt: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patientsTable.$inferSelect;
