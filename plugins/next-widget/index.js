const {
  withAndroidManifest,
  withDangerousMod,
  withMainApplication,
  withStringsXml,
} = require("@expo/config-plugins");
const { buildResourceItem } = require("@expo/config-plugins/build/android/Resources");
const { setStringItem } = require("@expo/config-plugins/build/android/Strings");
const fs = require("fs");
const path = require("path");

const PLUGIN_DIR = path.resolve(__dirname, "android");
const KOTLIN_FILES = [
  "WidgetBridgeModule.kt",
  "WidgetBridgePackage.kt",
  "NextWidgetProvider.kt",
  "WidgetActionReceiver.kt",
];

function withNextWidget(config) {
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (!mainApplication) return config;

    if (!mainApplication["receiver"]) mainApplication["receiver"] = [];
    mainApplication["receiver"].push({
      $: {
        "android:name": ".NextWidgetProvider",
        "android:exported": "true",
      },
      "intent-filter": [
        {
          action: [{ $: { "android:name": "android.appwidget.action.APPWIDGET_UPDATE" } }],
        },
      ],
      "meta-data": [
        {
          $: {
            "android:name": "android.appwidget.provider",
            "android:resource": "@xml/next_widget_info",
          },
        },
      ],
    });

    mainApplication["receiver"].push({
      $: {
        "android:name": ".WidgetActionReceiver",
        "android:exported": "true",
      },
      "intent-filter": [
        {
          action: [
            {
              $: {
                "android:name": "com.anonymous.remindme.WIDGET_DONE",
              },
            },
          ],
        },
      ],
    });

    return config;
  });

  config = withDangerousMod(config, [
    "android",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const androidDir = path.join(projectRoot, "android", "app", "src", "main");
      const javaDir = path.join(androidDir, "java", "com", "anonymous", "remindme");
      const resDir = path.join(androidDir, "res");

      for (const file of KOTLIN_FILES) {
        const src = path.join(PLUGIN_DIR, file);
        const dest = path.join(javaDir, file);
        if (fs.existsSync(src)) {
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.copyFileSync(src, dest);
        }
      }

      const layoutSrc = path.join(PLUGIN_DIR, "res", "layout");
      const layoutDest = path.join(resDir, "layout");
      const xmlSrc = path.join(PLUGIN_DIR, "res", "xml");
      const xmlDest = path.join(resDir, "xml");
      if (fs.existsSync(layoutSrc)) {
        fs.mkdirSync(layoutDest, { recursive: true });
        fs.copyFileSync(path.join(layoutSrc, "widget_layout.xml"), path.join(layoutDest, "widget_layout.xml"));
      }
      if (fs.existsSync(xmlSrc)) {
        fs.mkdirSync(xmlDest, { recursive: true });
        fs.copyFileSync(path.join(xmlSrc, "next_widget_info.xml"), path.join(xmlDest, "next_widget_info.xml"));
      }

      return config;
    },
  ]);

  config = withStringsXml(config, (config) => {
    setStringItem(
      [buildResourceItem({ name: "widget_description", value: "Next task reminder" })],
      config.modResults
    );
    return config;
  });

  config = withMainApplication(config, (config) => {
    let contents = config.modResults.contents;
    if (!contents.includes("WidgetBridgePackage")) {
      contents = contents.replace(
        "PackageList(this).packages.apply {",
        "PackageList(this).packages.apply {\n          add(WidgetBridgePackage())"
      );
    }
    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withNextWidget;
