import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.0497e2a81dfb4b9bb43730ee6b3f7741',
  appName: 'shadowtalk-ai',
  webDir: 'app',
  server: {
    cleartext: true
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
