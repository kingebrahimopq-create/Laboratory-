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
