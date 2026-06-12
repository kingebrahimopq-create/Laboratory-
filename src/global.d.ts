declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PORT: string;
      GEMINI_API_KEY?: string;
      DATABASE_URL?: string;
      MONGODB_URI?: string;
      FIREBASE_API_KEY?: string;
      FIREBASE_AUTH_DOMAIN?: string;
      FIREBASE_PROJECT_ID?: string;
      FIREBASE_STORAGE_BUCKET?: string;
      FIREBASE_MESSAGING_SENDER_ID?: string;
      FIREBASE_APP_ID?: string;
      FIREBASE_MEASUREMENT_ID?: string;
      GOOGLE_CLIENT_ID?: string;
      GOOGLE_CLIENT_SECRET?: string;
      PRINTER_IP_ADDRESS?: string;
      PRINTER_CONNECTION_TYPE?: string;
      PRINTER_PORT?: string;
      JWT_SECRET?: string;
      SESSION_SECRET?: string;
      DEFAULT_LAB_NAME_AR?: string;
      DEFAULT_LAB_NAME_EN?: string;
      DEFAULT_DOCTOR_NAME?: string;
      DEFAULT_CURRENCY?: string;
    }
  }

  interface Window {
    __LIMS_CONFIG__: {
      labName: string;
      version: string;
      features: {
        ai: boolean;
        printing: boolean;
        googleDrive: boolean;
        qrVerification: boolean;
        biometric: boolean;
      };
    };
  }
}

export {};
