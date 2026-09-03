import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.journeyguard.app',
  appName: 'Journey Guard',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;