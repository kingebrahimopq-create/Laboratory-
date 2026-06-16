import { pgTable, integer, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  labNameAr: text("lab_name_ar"),
  labNameEn: text("lab_name_en"),
  clinicName: text("clinic_name"),
  labPhone: text("lab_phone"),
  doctorName: text("doctor_name"),
  doctorLicense: text("doctor_license"),
  receptionUsername: text("reception_username"),
  receptionPassword: text("reception_password"),
  doctorEmail: text("doctor_email"),
  doctorPasscode: text("doctor_passcode"),
  receptionPermissions: text("reception_permissions").array(),
  allowBiometricBypass: boolean("allow_biometric_bypass").default(false),
  enableTechnicianPlatform: boolean("enable_technician_platform").default(true),
  enableAndroidSimulator: boolean("enable_android_simulator").default(false),
  canUploadWithFiles: boolean("can_upload_with_files").default(true),
  canUploadWithImages: boolean("can_upload_with_images").default(true),
  canUploadWithTyping: boolean("can_upload_with_typing").default(true),
  customTestPricing: jsonb("custom_test_pricing"),
  enableGoogleDriveBackup: boolean("enable_google_drive_backup").default(false),
  googleDriveToken: text("google_drive_token"),
  googleDriveBackupInterval: text("google_drive_backup_interval"),
  enableElectronicPrinter: boolean("enable_electronic_printer").default(true),
  allowResultCopying: boolean("allow_result_copying").default(true),
  printerConnectionType: text("printer_connection_type"),
  printerIpAddress: text("printer_ip_address"),
  currency: text("currency").default("EGP"),
  barcodeLocation: text("barcode_location").default("bottom"),
  thermalWidth: text("thermal_width").default("80mm"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
