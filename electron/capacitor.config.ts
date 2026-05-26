import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowtalk.ai',
  appName: 'ShadowTalk AI',
  webDir: 'app',
  server: {
    cleartext: true,
  },
  electron: {
    customUrlScheme: 'shadowtalk',
    trayIconAndMenuEnabled: true,
    splashScreenEnabled: true,
    splashScreenImageName: 'splash.png',
    backgroundColor: '#050508',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#050508',
      showSpinner: true,
      spinnerColor: '#818cf8',
    },
  },
};

export default config;
