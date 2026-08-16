// import 'package:flutter/material.dart';
// import 'package:flutter_svg/svg.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_assets.dart';

// class EmptyAppRefresh extends StatelessWidget {
//   const EmptyAppRefresh({
//     super.key,
//     this.icon,
//     this.image,
//     this.iconH,
//     required this.title,
//     required this.onRefresh,
//   });

//   final String title;
//   final String? icon;
//   final String? image;
//   final double? iconH;
//   final Future<void> Function() onRefresh;

//   @override
//   Widget build(BuildContext context) {
//     return RefreshIndicator.adaptive(
//       onRefresh: onRefresh,
//       color: context.colors.iconBrand,
//       child: Stack(
//         alignment: Alignment.center,
//         children: [
//           Column(
//             mainAxisSize: MainAxisSize.min,
//             spacing: (14),
//             children: [
//               if (image != null)
//                 Image.asset(image!, height: (iconH ?? 160))
//               else
//                 SvgPicture.asset(
//                   icon ?? AppIcons.icInfoCircle,
//                   height: (iconH ?? 40),
//                 ),
//               Text(title, style: context.textStyles.semibold18),
//             ],
//           ),
//           ListView(children: const []),
//         ],
//       ),
//     );
//   }
// }
