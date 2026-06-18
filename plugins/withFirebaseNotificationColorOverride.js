const { withAndroidManifest } = require("@expo/config-plugins");

const FCM_NOTIFICATION_COLOR =
  "com.google.firebase.messaging.default_notification_color";

function withFirebaseNotificationColorOverride(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    const application = manifest.application?.[0];
    const metadata = application?.["meta-data"] || [];

    for (const item of metadata) {
      if (item.$?.["android:name"] === FCM_NOTIFICATION_COLOR) {
        item.$["tools:replace"] = "android:resource";
      }
    }

    return config;
  });
}

module.exports = withFirebaseNotificationColorOverride;
