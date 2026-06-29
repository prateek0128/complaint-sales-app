const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      let contents = fs.readFileSync(podfilePath, "utf-8");

      if (!contents.includes("use_modular_headers!")) {
        contents = contents.replace(
          "prepare_react_native_project!",
          "use_modular_headers!\n\nprepare_react_native_project!"
        );
        fs.writeFileSync(podfilePath, contents);
      }

      return config;
    },
  ]);
}

module.exports = withModularHeaders;
