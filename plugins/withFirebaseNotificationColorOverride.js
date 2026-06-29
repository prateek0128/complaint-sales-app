const { withAndroidManifest } = require("@expo/config-plugins");

const FCM_NOTIFICATION_COLOR = "com.google.firebase.messaging.default_notification_color";

function withFirebaseNotificationColorOverride(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    // Ensure xmlns:tools is declared on the root manifest element
    manifest.$ = manifest.$ || {};
    manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";

    const application = manifest.application?.[0];
    if (!application) return config;

    application["meta-data"] = application["meta-data"] || [];

    for (const item of application["meta-data"]) {
      if (item.$?.["android:name"] === FCM_NOTIFICATION_COLOR) {
        item.$["tools:replace"] = "android:resource";
      }
    }

    return config;
  });
}

module.exports = withFirebaseNotificationColorOverride;
