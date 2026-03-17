module.exports = {
  expo: {
    name: "Next",
    slug: "remind-me",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f0f0f",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.remindme",
      appleTeamId: "2JZ57K5CZY",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#1a1a1a",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.remindme",
      permissions: [
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.POST_NOTIFICATIONS",
      ],
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "./plugins/next-widget",
      "expo-background-task",
      [
        "expo-audio",
        {
          enableBackgroundPlayback: false,
        },
      ],
      "expo-notifications",
      [
        "expo-widgets",
        {
          groupIdentifier: "group.com.anonymous.remindme",
          frequentUpdates: true,
          widgets: [
            {
              name: "NextWidget",
              displayName: "Next",
              description: "Next task reminder",
              supportedFamilies: [
                "systemSmall",
                "systemMedium",
                "systemLarge",
                "accessoryRectangular",
                "accessoryInline",
              ],
            },
          ],
        },
      ],
      "./plugins/remove-push-entitlement",
    ],
  },
};
