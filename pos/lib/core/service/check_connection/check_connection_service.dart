// // ignore_for_file: use_build_context_synchronously

// import 'dart:async';

// import 'package:mary_ai_pos/core/routes/app_routes.dart';
// import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
// import 'package:connectivity_plus/connectivity_plus.dart';
// import 'package:flutter/material.dart';

// class CheckConnection {
//   CheckConnection._();

//   static Future<void> scheduleRequest() async {
//     var connectivity = Connectivity();

//     connectivity.onConnectivityChanged.listen((connectivityResult) async {
//       final doubleCheck = await connectivity.checkConnectivity();
//       if (doubleCheck.contains(ConnectivityResult.wifi) ||
//           doubleCheck.contains(ConnectivityResult.mobile) ||
//           connectivityResult.contains(ConnectivityResult.ethernet)) {
//         if (navigatorKey.currentState?.canPop() ?? false) {
//           navigatorKey.currentState!.pop();
//         }
//       } else {
//         await Future.delayed(const Duration(milliseconds: 1000));
//         debugPrint("doubleCheck $doubleCheck");
//         if (doubleCheck.contains(ConnectivityResult.none)) {
//           Navigator.pushNamed(
//             navigatorKey.currentState!.context,
//             AppRoutes.noInternetScreen,
//           );
//         }
//       }
//     });
//   }
// }
