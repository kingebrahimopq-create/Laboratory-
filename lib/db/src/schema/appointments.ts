import { pgTable, text, date, time, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appointmentsTable = pgTable("appointments", {
  id: text("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  patientPhone: text("patient_phone"),
  date: date("date", { mode: "string" }).notNull(),
  time: time("time").notNull(),
  type: text("type"),
  testType: text("test_type"),
  status: text("status").default("pending"),
  notes: text("notes"),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertAppointmentSchema = createInsertSchema(appointmentsTable).omit({ createdAt: true });
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointmentsTable.$inferSelect;
