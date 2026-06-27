import { auth, db } from './supabase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInAnonymously } from './supabase-auth';
import { doc, getDoc, setDoc } from './supabase-firestore';
import { User, UserRole } from '../types';

export const loginAnonymously = async () => {
  return await signInAnonymously(auth);
};

export const registerUser = async (email: string, password: string, userData: Omit<User, 'id'>) => {
  // Enforce patient role for self-registration unless it's the owner
  const role = email === 'mhm763517@gmail.com' ? 'admin' : 'patient';
  
  const profileData = {
    ...userData,
    role: role as UserRole,
  };
  
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCredential.user.uid;
  
  await setDoc(doc(db, 'users', uid), {
    ...profileData,
    id: uid,
  });
  
  return uid;
};

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return await signOut(auth);
};

export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return (userDoc.data() as User).role;
  }
  return null;
};
