const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

const FIREBASE_NOTIFICATION_COLOR_META_DATA =
  /<meta-data\b(?=[^>]*android:name="com\.google\.firebase\.messaging\.default_notification_color")(?=[^>]*android:resource="@color\/notification_icon_color")([^>]*)\/>/g;

function addToolsReplaceToFirebaseNotificationColor(contents) {
  return contents.replace(FIREBASE_NOTIFICATION_COLOR_META_DATA, (match, attributes) => {
    if (attributes.includes("tools:replace=")) {
      return match;
    }

    return match.replace("/>", ' tools:replace="android:resource"/>');
  });
}

function getAndroidManifestPaths(androidProjectRoot) {
  const sourceRoot = path.join(androidProjectRoot, "app/src");

  if (!fs.existsSync(sourceRoot)) {
    return [];
  }

  return fs
    .readdirSync(sourceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(sourceRoot, entry.name, "AndroidManifest.xml"))
    .filter((manifestPath) => fs.existsSync(manifestPath));
}

function withFirebaseNotificationColorOverride(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      for (const manifestPath of getAndroidManifestPaths(config.modRequest.platformProjectRoot)) {
        const contents = fs.readFileSync(manifestPath, "utf-8");
        const updatedContents = addToolsReplaceToFirebaseNotificationColor(contents);

        if (updatedContents !== contents) {
          fs.writeFileSync(manifestPath, updatedContents);
        }
      }

      return config;
    },
  ]);
}

module.exports = withFirebaseNotificationColorOverride;
