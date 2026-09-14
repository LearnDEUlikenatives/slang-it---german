import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.learngermanlikenatives.slangitgerman',
  appName: 'Slang It - German',
  webDir: 'dist',
  backgroundColor: '#FF71CE',
  android: {
    backgroundColor: '#FF71CE',
    allowMixedContent: true,
  },
  plugins: {
    AdMob: {
      appId: 'ca-app-pub-4045089359333252~3927685995',
      testingDevices: [],
    },
  },
};

export default config;
