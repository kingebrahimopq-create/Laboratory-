import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mylab.android',
  appName: 'MyLab LIMS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
