module.exports = {
  expo: {
    name: 'Next',
    slug: 'remind-me',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0f0f0f',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.remindme',
    },
    android: {
      adaptiveIcon: {
        backgroundColor: '#1a1a1a',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      package: 'com.anonymous.remindme',
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_BACKGROUND_LOCATION',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_LOCATION',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: 'AIzaSyBit3TcvIvD2XM0R0RdYNha1JDKJblb97U',
          iosGoogleMapsApiKey: 'AIzaSyBit3TcvIvD2XM0R0RdYNha1JDKJblb97U',
        },
      ],
      './plugins/next-widget',
      'expo-background-task',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Next uses your location to remind you when you arrive at a saved address.',
          locationWhenInUsePermission: 'Next uses your location to remind you when you arrive at a saved address.',
          isAndroidBackgroundLocationEnabled: true,
          isIosBackgroundLocationEnabled: true,
        },
      ],
      'expo-notifications',
    ],
  },
};
