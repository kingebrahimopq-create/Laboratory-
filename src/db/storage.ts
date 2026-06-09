import { Patient, LabTest, Appointment, DoctorSettings } from '../types';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_TESTS } from '../data';

// Local storage keys
const KEY_PATIENTS = 'mylab_db_patients';
const KEY_APPOINTMENTS = 'mylab_db_appointments';
const KEY_TESTS = 'mylab_db_tests';
const KEY_SETTINGS = 'mylab_db_settings';

const DEFAULT_SETTINGS: DoctorSettings = {
  labNameAr: "مختبر المالك الطبي المركزي",
  labNameEn: "Owner's Central Clinical Laboratory (MyLab)",
  doctorName: "د. عبد الرحمن الفضلي",
  doctorLicense: "SCHS-772910-AR",
  receptionUsername: "receptionist",
  receptionPassword: "123",
  receptionPermissions: ['register_patient', 'billing', 'appointments', 'view_all_records'],
  allowBiometricBypass: false,
  enableTechnicianPlatform: true,
  enableAndroidSimulator: true,
  canUploadWithFiles: true,
  canUploadWithImages: true,
  canUploadWithTyping: true,
  customTestPricing: {
    CBC: 180,
    LIPID: 240,
    LIVER: 300,
    GLUCOSE: 120
  },
  // Automatically configure Google Drive and electronic printer Defaults
  enableGoogleDriveBackup: true,
  googleDriveToken: "DRIVE_AUTH_TOKEN_PLACEHOLDER",
  googleDriveBackupInterval: "immediate",
  enableElectronicPrinter: true,
  allowResultCopying: true,
  printerConnectionType: "network",
  printerIpAddress: "192.168.1.100",
  currency: "EGP"
};

/**
 * Robust Clinical Database Module
 * Provides genuine database persistence across restarts, browser closures, or reboots.
 * This satisfies both Windows desktop local database requirements and Android mobile offline architectures.
 */
export const ClinicalDatabase = {
  /**
   * Doctor Settings Operations
   */
  getSettings(): DoctorSettings {
    try {
      const stored = localStorage.getItem(KEY_SETTINGS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read settings:', e);
    }
    this.saveSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },

  saveSettings(newSettings: DoctorSettings): DoctorSettings {
    try {
      localStorage.setItem(KEY_SETTINGS, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    return newSettings;
  },
  /**
   * Patients Table Operations
   */
  getPatients(): Patient[] {
    try {
      const stored = localStorage.getItem(KEY_PATIENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read patients from storage:', e);
    }
    // Seed default records if empty to ensure the app is never blank
    this.saveAllPatients(INITIAL_PATIENTS);
    return INITIAL_PATIENTS;
  },

  savePatient(newPatient: Patient): Patient[] {
    const list = this.getPatients();
    // Check if patient already exists (UPSERT)
    const index = list.findIndex(p => p.id === newPatient.id);
    if (index >= 0) {
      list[index] = newPatient;
    } else {
      list.unshift(newPatient);
    }
    this.saveAllPatients(list);
    return list;
  },

  saveAllPatients(patients: Patient[]): void {
    try {
      localStorage.setItem(KEY_PATIENTS, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to save patients to local DB:', e);
    }
  },

  /**
   * Appointments Table Operations
   */
  getAppointments(): Appointment[] {
    try {
      const stored = localStorage.getItem(KEY_APPOINTMENTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read appointments from storage:', e);
    }
    this.saveAllAppointments(INITIAL_APPOINTMENTS);
    return INITIAL_APPOINTMENTS;
  },

  saveAppointment(newApt: Appointment): Appointment[] {
    const list = this.getAppointments();
    const index = list.findIndex(a => a.id === newApt.id);
    if (index >= 0) {
      list[index] = newApt;
    } else {
      list.unshift(newApt);
    }
    this.saveAllAppointments(list);
    return list;
  },

  saveAllAppointments(apts: Appointment[]): void {
    try {
      localStorage.setItem(KEY_APPOINTMENTS, JSON.stringify(apts));
    } catch (e) {
      console.error('Failed to save appointments to local DB:', e);
    }
  },

  /**
   * Laboratory Tests (and QR Tokens) Table Operations
   */
  getTests(): LabTest[] {
    try {
      const stored = localStorage.getItem(KEY_TESTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to read tests from storage:', e);
    }
    this.saveAllTests(INITIAL_TESTS);
    return INITIAL_TESTS;
  },

  saveTest(newTest: LabTest): LabTest[] {
    const list = this.getTests();
    const index = list.findIndex(t => t.id === newTest.id);
    if (index >= 0) {
      list[index] = newTest;
    } else {
      list.unshift(newTest);
    }
    this.saveAllTests(list);
    return list;
  },

  saveAllTests(tests: LabTest[]): void {
    try {
      localStorage.setItem(KEY_TESTS, JSON.stringify(tests));
    } catch (e) {
      console.error('Failed to save tests to local DB:', e);
    }
  }
};
