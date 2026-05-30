import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shadowtalk.ai',
  appName: 'ShadowTalk AI',
  webDir: 'dist',
  // Bundled web assets for desktop/mobile — do not point at a remote dev URL in production.
  server: {
    cleartext: true,
    androidScheme: 'https',
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
      spinnerColor: '#818cf8'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#050508'
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'shadowtalk'
  },
  android: {
    backgroundColor: '#050508',
    allowMixedContent: true
  }
};

export default config;
