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
  testDate: string;
  testValue: string;
  status: 'Released' | 'Pending' | 'normal' | 'abnormal' | 'critical';
  notes?: string;
  createdAt?: string;
  driveFileId?: string;
}

export interface Vaccination {
  id: string;
  patientName: string;
  patientId: string;
  vaccineType: string;
  vaccineDate: string;
  doseNumber: number | string;
  status: 'Completed' | 'Scheduled' | 'Pending';
  vaccineName?: string;
  notes?: string;
  createdAt?: string;
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
