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
    console.warn('signInWithPopup failed or not supported, checking environments for fallback viability...', error);
    
    // Check if redirect will fail due to storage partitioning (iframes, Safari/iOS with cross-site tracking, in-app webviews)
    const isIframe = window.self !== window.top;
    const isCapacitor = (window as any).Capacitor !== undefined || /capacitor/i.test(navigator.userAgent || '');
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');
    
    if (
      isIframe || 
      isCapacitor || 
      (isMobile && (error?.code === 'auth/popup-blocked' || error?.code === 'auth/operation-not-supported-in-this-environment')) ||
      (isSafari && error?.code === 'auth/popup-blocked')
    ) {
      console.error('Environment does not support safe popup/redirect auth. Preventing fatal redirect to firebaseapp.com.', error);
      throw new Error('auth/partitioned-storage-or-iframe-unsupported');
    }

    if (
      error?.code === 'auth/operation-not-supported-in-this-environment' ||
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      /unsupported|blocked|popup/i.test(error?.message || '')
    ) {
      const { signInWithRedirect } = await import('firebase/auth');
      await signInWithRedirect(auth, googleProvider);
      return null;
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
