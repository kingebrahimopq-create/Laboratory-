import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { User, UserRole, StaffInvite } from '../types';
const USERS = 'users';
const INVITES = 'staff_invites';
const SETTINGS = 'settings';
export async function getUserProfile(uid: string): Promise<User | null> {
  try { const s = await getDoc(doc(db,USERS,uid)); if(!s.exists())return null; return {id:s.id,...s.data()} as User; } catch { return null; }
}
export async function getUserProfileByEmail(email: string): Promise<User | null> {
  try { const s = await getDocs(query(collection(db,USERS),where('email','==',email.toLowerCase()))); if(s.empty)return null; const d=s.docs[0]; return {id:d.id,...d.data()} as User; } catch { return null; }
}
export async function createUserProfile(uid: string, data: Omit<User,'id'>): Promise<void> {
  await setDoc(doc(db,USERS,uid),{...data,createdAt:new Date().toISOString()});
}
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await updateDoc(doc(db,USERS,uid),{role});
}
export async function getStaffInvite(email: string): Promise<StaffInvite | null> {
  try { const s = await getDoc(doc(db,INVITES,email.toLowerCase())); if(!s.exists())return null; return s.data() as StaffInvite; } catch { return null; }
}
export async function deleteStaffInvite(email: string): Promise<void> {
  try { await deleteDoc(doc(db,INVITES,email.toLowerCase())); } catch { /* silent */ }
}
export async function getOwnerEmail(): Promise<string> {
  try { const s=await getDoc(doc(db,SETTINGS,'app')); if(s.exists()&&s.data().ownerEmail)return s.data().ownerEmail as string; } catch { /* silent */ }
  return 'mhm763517@gmail.com';
}
