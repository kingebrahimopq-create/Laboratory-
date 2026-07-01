import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : undefined) || process.env.VITE_SUPABASE_URL || 'https://tgbwmcgnyqejjyrxurab.supabase.co';
// Force service_role key to enable admin features (bypass email verification, auto-confirm accounts)
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYndtY2dueXFlamp5cnh1cmFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxMDU5NCwiZXhwIjoyMDk3Nzg2NTk0fQ.i4qHN60-IDrsL9_0bSFhJ1GHJPhEPPNhxmoTI1ckum8';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Mock Firebase structure for compatibility
export const app = { name: '[DEFAULT]' };
export const db = supabase;
export const storage = supabase.storage;
export const appCheck = null;
export const analytics = null;
export const performance = null;

export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (cb: any) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = { 
          uid: session.user.id, 
          email: session.user.email,
          emailVerified: !!session.user.email_confirmed_at,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          isAnonymous: false,
          tenantId: null,
          providerData: []
        };
        auth.currentUser = user;
        cb(user);
      } else {
        auth.currentUser = null;
        cb(null);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user = { 
          uid: session.user.id, 
          email: session.user.email,
          emailVerified: !!session.user.email_confirmed_at,
          displayName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          isAnonymous: false,
          tenantId: null,
          providerData: []
        };
        auth.currentUser = user;
        cb(user);
      } else {
        auth.currentUser = null;
        cb(null);
      }
    }).catch((e) => {
      console.error('Supabase auth error:', e);
      cb(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }
};
