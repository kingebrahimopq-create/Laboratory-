export type UserRole = 'admin' | 'receptionist' | 'technician' | 'patient' | 'phlebotomist';

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  picture?: string;
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  nameAr: string;
  phone?: string;
  email?: string;
}

export interface Patient {
  id: string;
  name: string;
  nameAr: string;
  email?: string;
  phone: string;
  gender: string;
  dob: Date;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Test {
  id: string;
  patientId: string;
  type: string;
  parameters: Record<string, unknown>;
  results?: Record<string, unknown>;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffInvite {
  email: string;
  role: UserRole;
  name?: string;
  nameAr?: string;
  createdAt: Date;
}

export interface LabResult {
  id: string;
  patientName: string;
  testType: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: 'normal' | 'abnormal' | 'critical';
  notes?: string;
  performedAt: string;
  createdAt: string;
  driveFileId?: string;
}

export interface Vaccination {
  id: string;
  patientName: string;
  vaccineName: string;
  dose?: string;
  lotNumber?: string;
  site?: string;
  administeredAt: string;
  nextDoseDate?: string;
  notes?: string;
  createdAt: string;
  driveFileId?: string;
}

export interface GithubStatus {
  branch: string;
  lastCommit: string;
  commitMessage: string;
  commitDate: string;
  deployStatus: 'success' | 'failure' | 'pending' | 'unknown';
  appVersion: string;
}
