import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chatapp.app',
  appName: 'ChatApp',
  webDir: 'dist',
  server: {
    // for dev: android emulator can't use localhost, use 10.0.2.2
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true
  }
};

export default config;