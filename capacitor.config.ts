import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.mylab.lims',
  appName: 'MyLab LIMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    url: 'https://my-lab-lims-jyy52pp8e-mhm763517-7111s-projects.vercel.app'
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0d9488',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
