import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tgbwmcgnyqejjyrxurab.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_gI2ElexDJe3MO89iof8nUQ_xono7L9R';

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
    });
    return () => {};
  }
};
