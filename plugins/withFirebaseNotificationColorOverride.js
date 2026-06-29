const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const OLD_TAG = 'android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notification_icon_color"/>';
const NEW_TAG = 'android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/notification_icon_color" tools:replace="android:resource"/>';

function withFirebaseNotificationColorOverride(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const manifestPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/AndroidManifest.xml"
      );

      let contents = fs.readFileSync(manifestPath, "utf-8");

      if (contents.includes(OLD_TAG)) {
        contents = contents.replace(OLD_TAG, NEW_TAG);
        fs.writeFileSync(manifestPath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseNotificationColorOverride;
