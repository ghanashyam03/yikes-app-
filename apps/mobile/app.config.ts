import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'yikes!',
  slug: 'yikes-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'yikes',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.yikes.app',
    infoPlist: {
      NSPhotoLibraryUsageDescription: 'Photo Library is used for Reply Helper to attach screenshots of conversations.',
      NSCalendarsUsageDescription: 'Calendar is used to suggest timely check-ins and session reminders.',
      NSUserNotificationsUsageDescription: 'Notifications are used for gentle rhythm nudges and weekly letters.',
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: '#121214',
    },
    package: 'com.yikes.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
  },
  plugins: ['expo-router', 'expo-font', 'expo-secure-store', 'expo-local-authentication'],
  experiments: {
    typedRoutes: true,
  },
});
