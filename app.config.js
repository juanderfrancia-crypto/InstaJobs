const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'InstaJobs (Dev)' : 'InstaJobs',
    slug: 'instajobs',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/iconoinsta.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#F97316',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? 'com.instajobs.app.dev' : 'com.instajobs.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/iconoinsta.png',
        backgroundColor: '#F97316',
      },
      package: IS_DEV ? 'com.instajobs.app.dev' : 'com.instajobs.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'WRITE_EXTERNAL_STORAGE',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? 'com.instajobs.app.dev' : 'com.instajobs.app',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
      },
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/iconoinsta.png',
          color: '#F97316',
          defaultChannel: 'default',
          sounds: [],
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Necesitamos tu ubicación para mostrarte trabajadores cercanos.',
        },
      ],
    ],
    newArchEnabled: false,
    scheme: 'instajobs',
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: '612b48ad-e3a8-4595-b8c4-692eb89ef184',
      },
    },
  },
};
