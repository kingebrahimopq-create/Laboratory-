import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://tgbwmcgnyqejjyrxurab.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnYndtY2dueXFlamp5cnh1cmFiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjIxMDU5NCwiZXhwIjoyMDk3Nzg2NTk0fQ.i4qHN60-IDrsL9_0bSFhJ1GHJPhEPPNhxmoTI1ckum8";

export const supabase = createClient(supabaseUrl, supabaseKey);

// Firebase App mock
export const app = { name: '[DEFAULT]' };
export const db = supabase;
export const storage = supabase.storage;
export const appCheck = null;
export const analytics = null;
export const performance = null;

export const auth = {
  currentUser: null as any,
  onAuthStateChanged: (cb: any) => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        auth.currentUser = { uid: session.user.id, email: session.user.email };
        cb({ uid: session.user.id, email: session.user.email });
      } else {
        auth.currentUser = null;
        cb(null);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        auth.currentUser = { uid: session.user.id, email: session.user.email };
        cb({ uid: session.user.id, email: session.user.email });
      } else {
        auth.currentUser = null;
        cb(null);
      }
    }).catch((e) => {
      console.error('Supabase auth error:', e);
      cb(null);
    });
    return () => {};
  }
};
