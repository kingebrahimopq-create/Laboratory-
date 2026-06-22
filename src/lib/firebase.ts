import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export { app };
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); 

let authInstance;
try {
  // Exclude indexedDBLocalPersistence because it triggers DOM and Security exceptions inside cross-origin sandboxed iframes.
  authInstance = initializeAuth(app, {
    persistence: [browserLocalPersistence, browserSessionPersistence, inMemoryPersistence]
  });
} catch (e) {
  console.warn('initializeAuth with standard browser storage persistence failed, attempting memory fallback:', e);
  try {
    authInstance = initializeAuth(app, {
      persistence: inMemoryPersistence
    });
  } catch (err2) {
    console.error('Final fallback to default getAuth:', err2);
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
