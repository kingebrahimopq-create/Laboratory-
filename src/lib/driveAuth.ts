import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { app, auth as existingAuth } from './firebase';

const auth = existingAuth;
const provider = new GoogleAuthProvider();
// Required Google Drive scopes
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;

const getCachedToken = (): string | null => {
  try {
    return sessionStorage.getItem('drive_access_token');
  } catch {
    return null;
  }
};

const setCachedToken = (token: string | null) => {
  try {
    if (token) {
      sessionStorage.setItem('drive_access_token', token);
    } else {
      sessionStorage.removeItem('drive_access_token');
    }
  } catch {}
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check for redirect result on initialization
  getRedirectResult(auth).then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedToken(credential.accessToken);
        if (auth.currentUser && onAuthSuccess) {
          onAuthSuccess(auth.currentUser, credential.accessToken);
        }
      }
    }
  }).catch((err) => {
    console.error('getRedirectResult error for Drive:', err);
  });

  return onAuthStateChanged(auth, async (user: User | null) => {
    const cachedToken = getCachedToken();
    if (user) {
      if (cachedToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedToken);
      } else if (!isSigningIn) {
        setCachedToken(null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      setCachedToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      console.warn('signInWithPopup failed for Drive, checking environment parameters...', popupErr);
      
      const isIframe = window.self !== window.top;
      const isCapacitor = (window as any).Capacitor !== undefined || /capacitor/i.test(navigator.userAgent || '');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent || '');

      if (
        isIframe || 
        isCapacitor || 
        (isMobile && (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/operation-not-supported-in-this-environment')) ||
        (isSafari && popupErr?.code === 'auth/popup-blocked')
      ) {
        console.error('Environment does not support safe popup/redirect auth for Google Drive. Preventing fatal redirect to firebaseapp.com.', popupErr);
        throw new Error('auth/partitioned-storage-or-iframe-unsupported');
      }

      if (
        popupErr?.code === 'auth/operation-not-supported-in-this-environment' ||
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/popup-closed-by-user' ||
        popupErr?.code === 'auth/cancelled-popup-request' ||
        /unsupported|blocked|popup/i.test(popupErr?.message || '')
      ) {
        await signInWithRedirect(auth, provider);
        return null; // Will resume in redirect callback
      }
      throw popupErr;
    }

    if (!result) return null;

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    setCachedToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return getCachedToken();
};

export const logout = async () => {
  await auth.signOut();
  setCachedToken(null);
};
