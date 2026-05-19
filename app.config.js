const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'InstaJobs (Dev)' : 'InstaJobs',
    slug: 'instajobs',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#2563EB',
      },
      package: IS_DEV ? 'com.instajobs.app.dev' : 'com.instajobs.app',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'CAMERA',
        'READ_EXTERNAL_STORAGE',
        'READ_MEDIA_IMAGES',
        'READ_MEDIA_VIDEO',
        'WRITE_EXTERNAL_STORAGE',
        'RECEIVE_BOOT_COMPLETED',
        'VIBRATE',
      ],
      ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
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
          icon: './assets/icon.png',
          color: '#2563EB',
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
      [
        'expo-image-picker',
        {
          photosPermission: 'Permite a InstaJobs acceder a tus fotos para subir imágenes de perfil y trabajos.',
          cameraPermission: 'Permite a InstaJobs usar la cámara para tomar fotos de perfil y trabajos.',
        },
      ],
    ],
    newArchEnabled: true,
    scheme: 'instajobs',
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: '63efcc22-f406-4d4e-9106-23b1c0a1fd0b',
      },
    },
  },
};
