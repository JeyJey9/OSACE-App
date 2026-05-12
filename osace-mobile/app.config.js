export default {
  expo: {
    name: "OSACE",
    slug: "osace-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./src/assets/osace.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./src/assets/osace.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "ro.osace.app",  // ✅ ADĂUGAT
      supportsTablet: true
    },
    android: {
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./src/assets/osace.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      package: "ro.osace.app",  // ✅ SCHIMBAT (sincronizat cu app.json)
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      blockedPermissions: [  // ✅ ADĂUGAT (preventiv pentru AD_ID)
        "com.google.android.gms.permission.AD_ID"
      ]
    },
    extra: {
      eas: {
        projectId: "abd7ab63-afc2-4280-9e8f-fe551af8581d"
      }
    },
    plugins: [
      "expo-font",
      "expo-secure-store",
      "expo-web-browser",
      "expo-image-picker",
      "expo-camera"
    ]
  }
};
