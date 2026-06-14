import { initializeApp } from 'firebase/app';
    import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
    import firebaseConfig from '../firebase-applet-config.json';

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
    provider.addScope('https://www.googleapis.com/auth/userinfo.email');
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    let isSigningIn = false;
    let cachedAccessToken: string | null = null;

    export const initAuth = (
      onAuthSuccess?: (user: User, token: string) => void,
      onAuthFailure?: () => void
    ) => {
      return onAuthStateChanged(auth, async (user: User | null) => {
        if (user) {
          const storedToken = localStorage.getItem('firebase_access_token');
          if (storedToken && cachedAccessToken) {
            if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
          } else if (!isSigningIn) {
            cachedAccessToken = null;
            localStorage.removeItem('firebase_access_token');
            if (onAuthFailure) onAuthFailure();
          }
        } else {
          cachedAccessToken = null;
          localStorage.removeItem('firebase_access_token');
          if (onAuthFailure) onAuthFailure();
        }
      });
    };

    export const googleSignIn = async (): Promise<void> => {
      try {
        isSigningIn = true;
        await signInWithRedirect(auth, provider);
        // Page will redirect to Google - result handled in handleAuthRedirectResult
      } catch (error: any) {
        isSigningIn = false;
        console.error('Sign in redirect error:', error);
        throw error;
      }
    };

    export const handleAuthRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          isSigningIn = false;
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            cachedAccessToken = credential.accessToken;
            localStorage.setItem('firebase_access_token', cachedAccessToken);
            return { user: result.user, accessToken: cachedAccessToken };
          }
        }
      } catch (error: any) {
        isSigningIn = false;
        console.error('Auth redirect result error:', error);
        throw error;
      }
      return null;
    };

    export const getAccessToken = async (): Promise<string | null> => {
      return cachedAccessToken || localStorage.getItem('firebase_access_token');
    };

    export const logout = async () => {
      await auth.signOut();
      cachedAccessToken = null;
      localStorage.removeItem('firebase_access_token');
    };
    