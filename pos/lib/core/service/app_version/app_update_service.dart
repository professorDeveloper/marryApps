// ignore_for_file: prefer_final_fields

import 'package:package_info_plus/package_info_plus.dart';

class AppUpdateService {
  // static String _playStore = "market://details?id=";
  // static String _appStore = "https://apps.apple.com/app/id\$";
  static String appCloudVersion = "0.0.0";
  static String appVersion = "0.0.0";

  static void checkUpdate() {
    //  launchUrlString(playStore + "uz.client");
    // launchUrlString("${_appStore}.client");
  }

  static Future<String> getCloudVersion() async {
    try {
      PackageInfo packageInfo = await PackageInfo.fromPlatform();
      String version = packageInfo.version;
      // var res = await AppVersionChecker().checkUpdate();
      // appCloudVersion = res.newVersion ?? "0.0.0";
      appVersion = version;
      return version;
    } catch (e) {
      return appVersion;
    }
  }
}
