import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.escolarai.app',
  appName: 'Escolar AI',
  webDir: 'src/web/public',
  android: {
    backgroundColor: '#0d0d12',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0d0d12',
      showSpinner: false,
    },
  },
};

export default config;
