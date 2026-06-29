const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FCM_COLOR_TAG = 'android:name="com.google.firebase.messaging.default_notification_color"';

function withFirebaseNotificationColorOverride(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/AndroidManifest.xml"
      );

      let contents = fs.readFileSync(manifestPath, "utf-8");

      // Add tools:replace if not already present on the FCM color meta-data tag
      if (contents.includes(FCM_COLOR_TAG) && !contents.includes('tools:replace="android:resource"')) {
        contents = contents.replace(
          new RegExp(`(<meta-data ${FCM_COLOR_TAG.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^/]*/?>)`),
          (match) => {
            if (match.includes('tools:replace')) return match;
            return match.replace('/>', ' tools:replace="android:resource"/>');
          }
        );
        fs.writeFileSync(manifestPath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseNotificationColorOverride;
