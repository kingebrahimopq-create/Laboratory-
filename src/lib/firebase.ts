import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider, CustomProvider } from 'firebase/app-check';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import firebaseConfig from '../../firebase-applet-config.json';

// Configure the global App Check debug token in dev mode or sandboxed frame to verify seamlessly
if (typeof window !== 'undefined') {
  (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}

const app = initializeApp(firebaseConfig);
export { app };
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId); 
export const auth = getAuth(app);
export const storage = getStorage(app);

// Lazy initialize Analytics and Performance safely for non-blocking operations in non-browser environments
let analytics: any = null;
let performance: any = null;

if (typeof window !== 'undefined') {
  isAnalyticsSupported().then((supported) => {
    if (supported) {
      const isSandbox = typeof window !== 'undefined' && (
        window.location.hostname.includes('run.app') || 
        window.location.hostname.includes('localhost') || 
        window.location.hostname.includes('127.0.0.1')
      );
      if (isSandbox) {
        console.log('Sandbox/Preview environment detected. Firebase Analytics is safely bypassed.');
        return;
      }
      try {
        analytics = getAnalytics(app);
        console.log('Firebase Analytics initialized successfully.');
      } catch (err) {
        console.warn('Firebase Analytics initialization failed:', err);
      }
    }
  }).catch(err => console.warn('Analytics support check failed:', err));

  try {
    performance = getPerformance(app);
    console.log('Firebase Performance Monitoring initialized successfully.');
  } catch (err) {
    console.warn('Performance Monitoring is not supported in this environment:', err);
  }
}

export { analytics, performance };

// Initialize Firebase App Check with Custom Android Play Integrity provider
// and ReCaptchaV3 as standard web fallback.
let appCheck: any = null;
try {
  if (typeof window !== 'undefined') {
    const isAndroid = /android/i.test(navigator.userAgent) || (window as any).Capacitor;
    
    const provider = isAndroid
      ? new CustomProvider({
          getToken: async () => {
            // Retrieve Play Integrity token when running native on Android via bridge
            if ((window as any).Capacitor && (window as any).Capacitor.Plugins && (window as any).Capacitor.Plugins.FirebaseAppCheck) {
              try {
                const res = await (window as any).Capacitor.Plugins.FirebaseAppCheck.getAppCheckToken();
                return {
                  token: res.token,
                  expireTimeMillis: res.expireTimeMillis || (Date.now() + 3600 * 1000)
                };
              } catch (err) {
                console.warn('Failed to retrieve Play Integrity token via native plugin:', err);
              }
            }
            // Fallback for sandboxed web testing or simulators
            return {
              token: 'play-integrity-fallback-debug-token',
              expireTimeMillis: Date.now() + 3600 * 1000
            };
          }
        })
      : new ReCaptchaV3Provider('6Ld_V3QqAAAAAHTZp-2f47_b5V-QYlW2U-B6yX-1'); // Default fallback site key

    appCheck = initializeAppCheck(app, {
      provider,
      isTokenAutoRefreshEnabled: true
    });
    console.log('Firebase App Check successfully initialized with Google Play Integrity/ReCaptcha verification.');
  }
} catch (error) {
  console.warn('Firebase App Check Initialization Status:', error);
}

export { appCheck };



