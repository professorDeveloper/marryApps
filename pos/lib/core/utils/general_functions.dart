import 'dart:async';
import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';

class MyFunctions {
  MyFunctions._();

  // Makes default avatar name
  static String makeDefaultAvatarName(String fullname) {
    final parts = fullname.trim().split(' ');
    final first = parts.isNotEmpty ? parts[0][0] : '';
    final last = parts.length > 1 ? parts.last[0] : '';
    return (first + last).toUpperCase();
  }

  /// Opens a link in the default browser or app for the given url.
  ///
  /// If the link could not be opened, throws a string describing the error.
  // static Future<void> openLink(String link) async {
  //   debugPrint("Link => $link");
  //   final Uri url = Uri.parse(link);
  //   if (await canLaunchUrl(url)) {
  //     await launchUrl(url);
  //   } else {
  //     throw 'Could not launch $url';
  //   }
  // }

  /// Makes a phone call to the given phone number.
  ///
  /// The phone number should be given in international format with a leading
  /// plus sign (e.g. "+998901234567").
  ///
  /// The function returns a [Future] that resolves when the call is made. If the
  /// call is not supported on the device, the [Future] will throw an error.
  // static Future<void> makePhoneCall(String phoneNumber) async {
  //   debugPrint("Phone $phoneNumber");
  //   final Uri launchUri = Uri(scheme: 'tel', path: phoneNumber);
  //   await launchUrl(launchUri);
  // }

  static Future<String> getDeviceId() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id;
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      return iosInfo.identifierForVendor ?? 'unknown_ios';
    } else {
      return 'unknown_device';
    }
  }

  static double percentageToDecimal(num percentage) {
    if (percentage > 100) return 1;
    return (percentage == 0 ? 0.01 : percentage / 100);
  }

  static Color getIndicatorColor(
    BuildContext context, {
    required num progress,
  }) => switch (progress) {
    >= 0 && <= 30 => context.colors.systemError,
    > 30 && < 70 => context.colors.systemAccent,
    >= 70 => context.colors.systemSuccess,
    _ => context.colors.border,
  };

  static String extractVideoId(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return '';

    // 1️⃣ watch?v=XXXX
    if (uri.queryParameters.containsKey('v')) {
      return uri.queryParameters['v']!;
    }

    // 2️⃣ youtu.be/XXXX
    if (url.contains('youtu.be/')) {
      return url.split('youtu.be/').last.split('?').first;
    }

    // 3️⃣ youtube.com/shorts/XXXX
    if (url.contains('/shorts/')) {
      return url.split('/shorts/').last.split('?').first;
    }

    // 4️⃣ youtube.com/embed/XXXX
    if (url.contains('/embed/')) {
      return url.split('/embed/').last.split('?').first;
    }

    return '';
  }

  // static Future<File> writeFileToTemp(
  //   Uint8List bytes,
  //   String objectName,
  // ) async {
  //   final dir = await getTemporaryDirectory();
  //   final file = File('${dir.path}/$objectName');

  //   if (await file.exists()) {
  //     return file;
  //   }

  //   await file.writeAsBytes(bytes, flush: true);
  //   return file;
  // }
}
