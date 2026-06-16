import { Patient, LabTest, Appointment, DoctorSettings, AppComplaint } from '../types';
import { ClinicalDatabase } from './storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export enum StorageType {
  LOCAL = 'local',
  SUPABASE = 'supabase',
  POSTGRESQL = 'postgresql'
}

export interface DatabaseConfig {
  type: StorageType;
  url?: string;
  key?: string;
}

export interface IDatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  patients: {
    findAll(): Promise<Patient[]>;
    findById(id: string): Promise<Patient | null>;
    create(patient: Patient): Promise<Patient>;
    update(id: string, patient: Partial<Patient>): Promise<Patient | null>;
    delete(id: string): Promise<boolean>;
  };
  
  appointments: {
    findAll(): Promise<Appointment[]>;
    findById(id: string): Promise<Appointment | null>;
    create(appointment: Appointment): Promise<Appointment>;
    update(id: string, appointment: Partial<Appointment>): Promise<Appointment | null>;
    delete(id: string): Promise<boolean>;
  };
  
  tests: {
    findAll(): Promise<LabTest[]>;
    findById(id: string): Promise<LabTest | null>;
    create(test: LabTest): Promise<LabTest>;
    update(id: string, test: Partial<LabTest>): Promise<LabTest | null>;
    delete(id: string): Promise<boolean>;
  };
  
  settings: {
    get(): Promise<DoctorSettings>;
    update(settings: Partial<DoctorSettings>): Promise<DoctorSettings>;
  };
  
  complaints: {
    findAll(): Promise<AppComplaint[]>;
    findById(id: string): Promise<AppComplaint | null>;
    create(complaint: AppComplaint): Promise<AppComplaint>;
    update(id: string, complaint: Partial<AppComplaint>): Promise<AppComplaint | null>;
  };
}

class SupabaseAdapter implements IDatabaseAdapter {
  private client: SupabaseClient;
  private connected = false;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  patients = {
    findAll: async (): Promise<Patient[]> => {
      const { data, error } = await this.client.from('patients').select('*');
      if (error) throw error;
      return data || [];
    },
    findById: async (id: string): Promise<Patient | null> => {
      const { data, error } = await this.client.from('patients').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },
    create: async (patient: Patient): Promise<Patient> => {
      const { data, error } = await this.client.from('patients').insert(patient).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, patient: Partial<Patient>): Promise<Patient | null> => {
      const { data, error } = await this.client.from('patients').update(patient).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await this.client.from('patients').delete().eq('id', id);
      return !error;
    }
  };

  appointments = {
    findAll: async (): Promise<Appointment[]> => {
      const { data, error } = await this.client.from('appointments').select('*');
      if (error) throw error;
      return data || [];
    },
    findById: async (id: string): Promise<Appointment | null> => {
      const { data, error } = await this.client.from('appointments').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },
    create: async (appointment: Appointment): Promise<Appointment> => {
      const { data, error } = await this.client.from('appointments').insert(appointment).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, appointment: Partial<Appointment>): Promise<Appointment | null> => {
      const { data, error } = await this.client.from('appointments').update(appointment).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await this.client.from('appointments').delete().eq('id', id);
      return !error;
    }
  };

  tests = {
    findAll: async (): Promise<LabTest[]> => {
      const { data, error } = await this.client.from('tests').select('*');
      if (error) throw error;
      return data || [];
    },
    findById: async (id: string): Promise<LabTest | null> => {
      const { data, error } = await this.client.from('tests').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },
    create: async (test: LabTest): Promise<LabTest> => {
      const { data, error } = await this.client.from('tests').insert(test).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, test: Partial<LabTest>): Promise<LabTest | null> => {
      const { data, error } = await this.client.from('tests').update(test).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    delete: async (id: string): Promise<boolean> => {
      const { error } = await this.client.from('tests').delete().eq('id', id);
      return !error;
    }
  };

  settings = {
    get: async (): Promise<DoctorSettings> => {
      const { data, error } = await this.client.from('settings').select('*').single();
      if (error) return ClinicalDatabase.getSettings();
      return data;
    },
    update: async (newSettings: Partial<DoctorSettings>): Promise<DoctorSettings> => {
      const { data, error } = await this.client.from('settings').upsert({ id: 1, ...newSettings }).select().single();
      if (error) throw error;
      return data;
    }
  };

  complaints = {
    findAll: async (): Promise<AppComplaint[]> => {
      const { data, error } = await this.client.from('complaints').select('*');
      if (error) throw error;
      return data || [];
    },
    findById: async (id: string): Promise<AppComplaint | null> => {
      const { data, error } = await this.client.from('complaints').select('*').eq('id', id).single();
      if (error) return null;
      return data;
    },
    create: async (complaint: AppComplaint): Promise<AppComplaint> => {
      const { data, error } = await this.client.from('complaints').insert(complaint).select().single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, complaint: Partial<AppComplaint>): Promise<AppComplaint | null> => {
      const { data, error } = await this.client.from('complaints').update(complaint).eq('id', id).select().single();
      if (error) throw error;
      return data;
    }
  };
}

class LocalStorageAdapter implements IDatabaseAdapter {
  private connected = true;
  async connect(): Promise<void> { this.connected = true; }
  async disconnect(): Promise<void> { this.connected = false; }
  isConnected(): boolean { return this.connected; }

  patients = {
    findAll: async (): Promise<Patient[]> => ClinicalDatabase.getPatients(),
    findById: async (id: string): Promise<Patient | null> => ClinicalDatabase.getPatients().find(p => p.id === id) || null,
    create: async (patient: Patient): Promise<Patient> => { ClinicalDatabase.savePatient(patient); return patient; },
    update: async (id: string, patient: Partial<Patient>): Promise<Patient | null> => {
      const existing = ClinicalDatabase.getPatients().find(p => p.id === id);
      if (!existing) return null;
      const updated = { ...existing, ...patient };
      ClinicalDatabase.savePatient(updated);
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const list = ClinicalDatabase.getPatients().filter(p => p.id !== id);
      ClinicalDatabase.saveAllPatients(list);
      return true;
    }
  };

  appointments = {
    findAll: async (): Promise<Appointment[]> => ClinicalDatabase.getAppointments(),
    findById: async (id: string): Promise<Appointment | null> => ClinicalDatabase.getAppointments().find(a => a.id === id) || null,
    create: async (appointment: Appointment): Promise<Appointment> => { ClinicalDatabase.saveAppointment(appointment); return appointment; },
    update: async (id: string, appointment: Partial<Appointment>): Promise<Appointment | null> => {
      const existing = ClinicalDatabase.getAppointments().find(a => a.id === id);
      if (!existing) return null;
      const updated = { ...existing, ...appointment };
      ClinicalDatabase.saveAppointment(updated);
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const list = ClinicalDatabase.getAppointments().filter(a => a.id !== id);
      ClinicalDatabase.saveAllAppointments(list);
      return true;
    }
  };

  tests = {
    findAll: async (): Promise<LabTest[]> => ClinicalDatabase.getTests(),
    findById: async (id: string): Promise<LabTest | null> => ClinicalDatabase.getTests().find(t => t.id === id) || null,
    create: async (test: LabTest): Promise<LabTest> => { ClinicalDatabase.saveTest(test); return test; },
    update: async (id: string, test: Partial<LabTest>): Promise<LabTest | null> => {
      const existing = ClinicalDatabase.getTests().find(t => t.id === id);
      if (!existing) return null;
      const updated = { ...existing, ...test };
      ClinicalDatabase.saveTest(updated);
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      const list = ClinicalDatabase.getTests().filter(t => t.id !== id);
      ClinicalDatabase.saveAllTests(list);
      return true;
    }
  };

  settings = {
    get: async (): Promise<DoctorSettings> => ClinicalDatabase.getSettings(),
    update: async (newSettings: Partial<DoctorSettings>): Promise<DoctorSettings> => {
      const current = ClinicalDatabase.getSettings();
      const updated = { ...current, ...newSettings };
      return ClinicalDatabase.saveSettings(updated);
    }
  };

  complaints = {
    findAll: async (): Promise<AppComplaint[]> => ClinicalDatabase.getComplaints(),
    findById: async (id: string): Promise<AppComplaint | null> => ClinicalDatabase.getComplaints().find(c => c.id === id) || null,
    create: async (complaint: AppComplaint): Promise<AppComplaint> => { ClinicalDatabase.saveComplaint(complaint); return complaint; },
    update: async (id: string, complaint: Partial<AppComplaint>): Promise<AppComplaint | null> => {
      const existing = ClinicalDatabase.getComplaints().find(c => c.id === id);
      if (!existing) return null;
      const updated = { ...existing, ...complaint };
      ClinicalDatabase.saveComplaint(updated);
      return updated;
    }
  };
}

export class DatabaseAdapter {
  private static instance: IDatabaseAdapter | null = null;
  private static config: DatabaseConfig = {
    type: (import.meta.env.VITE_SUPABASE_URL ? StorageType.SUPABASE : StorageType.LOCAL) as StorageType,
    url: import.meta.env.VITE_SUPABASE_URL,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY
  };

  static configure(config: DatabaseConfig): void {
    this.config = config;
    this.instance = null;
  }

  static create(): IDatabaseAdapter {
    if (this.config.type === StorageType.SUPABASE && this.config.url && this.config.key) {
      return new SupabaseAdapter(this.config.url, this.config.key);
    }
    return new LocalStorageAdapter();
  }

  static getInstance(): IDatabaseAdapter {
    if (!this.instance) {
      this.instance = this.create();
    }
    return this.instance;
  }
}

export const db = DatabaseAdapter.getInstance();
