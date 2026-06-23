import { supabase, auth as supabaseAuthObj } from './firebase';

export async function signInWithEmailAndPassword(authObj: any, email: string, pass: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) { console.error(error); throw error; }
  return { user: { uid: data.user.id, email: data.user.email } };
}

export async function createUserWithEmailAndPassword(authObj: any, email: string, pass: string) {
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if (error) { console.error(error); throw error; }
  return { user: { uid: data.user!.id, email: data.user!.email } };
}

export async function signOut(authObj: any) {
  await supabase.auth.signOut();
}

export function onAuthStateChanged(authObj: any, cb: any) {
  return supabaseAuthObj.onAuthStateChanged(cb);
}

export function signInAnonymously(authObj: any) {
  // Not natively supported by supabase in the same way without setup, just return a fake UID
  return Promise.resolve({ user: { uid: 'anon_' + Math.random().toString(36).substr(2, 9), email: null } });
}

export class GoogleAuthProvider {
  constructor() {}
}

export async function signInWithPopup(authObj: any, provider: any) {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
  if (error) throw error;
  return data;
}

export async function signInWithRedirect() {
  await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
}

export async function getRedirectResult() {
  return null;
}

export const RecaptchaVerifier = class { constructor() {} };
export async function signInWithPhoneNumber() { throw new Error("Not implemented in Supabase mock"); }
