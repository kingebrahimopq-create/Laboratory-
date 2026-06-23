import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0393240619",
  appId: "1:12279673341:web:39384f722fc71170e8e994",
  apiKey: "AIzaSyAai-OD1BCixe_E4qkUlOpvGvUUjT8VC7M",
  authDomain: "gen-lang-client-0393240619.firebaseapp.com",
  storageBucket: "gen-lang-client-0393240619.firebasestorage.app",
  messagingSenderId: "12279673341",
  measurementId: ""
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-36faa678-9403-4bc4-8c51-ff46feb8e4d7");
export const storage = getStorage(app);
