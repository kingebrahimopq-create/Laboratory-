import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User, UserRole } from '../types';

const googleProvider = new GoogleAuthProvider();

export const loginAnonymously = async () => {
  return await signInAnonymously(auth);
};

export const registerUser = async (email: string, password: string, userData: Omit<User, 'id'>) => {
  // Enforce patient role for self-registration
  const profileData = {
    ...userData,
    role: 'patient' as UserRole,
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

export const loginWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    console.warn('signInWithPopup failed, analyzing environment...', error);

    // Never use signInWithRedirect — it redirects to firebaseapp.com and returns
    // "The requested action is invalid" or "state lost" errors on mobile/in-app browsers.
    // Instead, throw a clear error so the UI can show the alternative login bridge.
    const isIframe = window.self !== window.top;
    const isCapacitor = (window as any).Capacitor !== undefined || /capacitor/i.test(navigator.userAgent || '');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');

    if (
      isIframe ||
      isCapacitor ||
      isMobile ||
      isSafari ||
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/operation-not-supported-in-this-environment' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      throw new Error('auth/partitioned-storage-or-iframe-unsupported');
    }

    throw error;
  }
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

let globalEmulatedUser: any = null;

export const getEmulatedUser = () => {
  if (globalEmulatedUser) return globalEmulatedUser;
  try {
    const saved = sessionStorage.getItem('lis_emulated_user');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // blocked
  }
  return null;
};

export const setEmulatedUser = (user: any) => {
  globalEmulatedUser = user;
  try {
    if (user) {
      sessionStorage.setItem('lis_emulated_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('lis_emulated_user');
    }
  } catch (e) {
    // blocked
  }
};
