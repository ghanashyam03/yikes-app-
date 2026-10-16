{
  "expo": {
    "name": "yikes!",
    "slug": "yikes",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "scheme": "yikes",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#121214"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yikes.app",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "Photo Library is used for Reply Helper to attach screenshots of conversations.",
        "NSCalendarsUsageDescription": "Calendar is used to suggest timely check-ins and session reminders.",
        "NSUserNotificationsUsageDescription": "Notifications are used for gentle rhythm nudges and weekly letters."
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#121214"
      },
      "package": "com.yikes.app"
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
