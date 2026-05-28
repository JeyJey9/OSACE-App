export default ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: "ro.osace.app",
      supportsTablet: true,
    },
    android: {
      ...config.android,
      versionCode: config.android?.versionCode || 1,
      package: "ro.osace.app",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      blockedPermissions: [
        "com.google.android.gms.permission.AD_ID"
      ]
    }
  };
};
