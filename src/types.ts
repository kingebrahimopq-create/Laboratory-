export type UserRole = 'admin' | 'receptionist' | 'technician' | 'patient' | 'phlebotomist';

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
  parameters: any; // Using any for JSON structure
  results?: any;
  status: 'pending' | 'completed' | 'cancelled';
  assignedTo?: string;
  isDrawn?: boolean;
  drawnAt?: any;
  drawnBy?: string;
  drawNotes?: string;
  insuranceProvider?: string;
  insuranceApprovalNumber?: string;
  discountPercentage?: number;
  amountCollected?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabResult {
  id?: string;
  patientName: string;
  testType: string;
  testValue: string;
  status: string;
  testDate: string;
  notes?: string;
}

export interface GithubStatus {
  configured: boolean;
  currentSha: string;
  latestSha: string;
  commitMessage?: string;
  syncEnabled: boolean;
}

export interface Vaccination {
  id?: string;
  patientName: string;
  patientId: string;
  vaccineType: string;
  vaccineDate: string;
  doseNumber: number;
  status: string;
  notes?: string;
}
