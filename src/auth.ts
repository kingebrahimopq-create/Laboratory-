import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      cachedAccessToken = session.access_token;
      localStorage.setItem('supabase_access_token', cachedAccessToken);
      if (onAuthSuccess) onAuthSuccess(session.user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      localStorage.removeItem('supabase_access_token');
      if (onAuthFailure) onAuthFailure();
    }
  });

  return () => subscription.unsubscribe();
};

export const googleSignIn = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: window.location.origin,
      },
    });
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const handleAuthRedirectResult = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  if (session) {
    cachedAccessToken = session.access_token;
    localStorage.setItem('supabase_access_token', cachedAccessToken);
    return { user: session.user, accessToken: cachedAccessToken };
  }
  return null;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    cachedAccessToken = session.access_token;
    localStorage.setItem('supabase_access_token', cachedAccessToken);
    return cachedAccessToken;
  }
  
  return localStorage.getItem('supabase_access_token');
};

export const logout = async () => {
  await supabase.auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('supabase_access_token');
};
