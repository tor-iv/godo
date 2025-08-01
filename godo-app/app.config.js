const IS_DEV = process.env.NODE_ENV === 'development';
const IS_STAGING = process.env.NODE_ENV === 'staging';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const getAppName = () => {
  if (IS_STAGING) return 'Godo (Staging)';
  if (IS_DEV) return 'Godo (Dev)';
  return 'Godo';
};

const getBundleIdentifier = () => {
  if (IS_STAGING) return 'com.godo.app.staging';
  if (IS_DEV) return 'com.godo.app.dev';
  return 'com.godo.app';
};

const getPackageName = () => {
  if (IS_STAGING) return 'com.godo.app.staging';
  if (IS_DEV) return 'com.godo.app.dev';
  return 'com.godo.app';
};

const getSlug = () => {
  if (IS_STAGING) return 'godo-app-staging';
  if (IS_DEV) return 'godo-app-dev';
  return 'godo-app';
};

export default {
  expo: {
    name: getAppName(),
    slug: getSlug(),
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    
    // Environment-specific configuration
    extra: {
      environment: process.env.NODE_ENV || 'development',
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001/api',
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://localhost:8000',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      enableAnalytics: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
      enablePushNotifications: process.env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'true',
      enableBiometricAuth: process.env.EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH === 'true',
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
    },

    // Conditional plugins based on environment
    plugins: [
      // Add Sentry plugin only in staging/production
      ...(IS_PRODUCTION || IS_STAGING
        ? [
            [
              '@sentry/react-native/expo',
              {
                organization: process.env.SENTRY_ORG || 'godo-app',
                project: process.env.SENTRY_PROJECT || 'godo-mobile',
              },
            ],
          ]
        : []),
    ],

    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      buildNumber: '1',
      // App Store Connect configuration
      ...(IS_PRODUCTION && {
        config: {
          usesNonExemptEncryption: false,
        },
      }),
    },

    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: getPackageName(),
      versionCode: 1,
      edgeToEdgeEnabled: true,
      // Add permissions based on features
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'NOTIFICATIONS',
        ...(process.env.EXPO_PUBLIC_ENABLE_BIOMETRIC_AUTH === 'true'
          ? ['USE_FINGERPRINT', 'USE_BIOMETRIC']
          : []),
      ],
    },

    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },

    // Updates configuration
    updates: {
      url: `https://u.expo.dev/${process.env.EXPO_PROJECT_ID || 'your-project-id'}`,
      enabled: IS_PRODUCTION || IS_STAGING,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 5000,
    },

    // Runtime version for updates
    runtimeVersion: {
      policy: 'sdkVersion',
    },

    // Asset bundling optimization
    assetBundlePatterns: ['**/*'],

    // Development-only configuration
    ...(IS_DEV && {
      scheme: 'godo-dev',
      developmentClient: {
        silentLaunch: true,
      },
    }),

    // Production-only configuration
    ...(IS_PRODUCTION && {
      privacy: 'public',
    }),
  },
};