import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInWithRedirect, getRedirectResult } from './supabase-auth';
import { app, auth as existingAuth } from './firebase';

const auth = existingAuth;
const provider = new GoogleAuthProvider();

export interface User { uid: string; email: string | null; }

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
  getRedirectResult(auth).then((result: any) => {
    if (result) {
      const accessToken = result.session?.provider_token || null;
      if (accessToken) {
        setCachedToken(accessToken);
        if (auth.currentUser && onAuthSuccess) {
          onAuthSuccess(auth.currentUser, accessToken);
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
    let result: any;
    try {
      result = await signInWithPopup(auth, provider);
    } catch (popupErr: any) {
      console.warn('signInWithPopup failed for Drive, checking environment parameters...', popupErr);
      await signInWithRedirect(auth, provider);
      return null;
    }

    if (!result) return null;

    const accessToken = result.session?.provider_token || 'mock-token';

    setCachedToken(accessToken);
    return { user: { uid: result.user?.id || 'id', email: result.user?.email || null }, accessToken };
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
  try {
    const { signOut } = await import('./supabase-auth');
    await signOut(auth);
  } catch (e) {
  }
  setCachedToken(null);
};
