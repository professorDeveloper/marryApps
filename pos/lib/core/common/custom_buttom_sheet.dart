// import 'package:mary_ai_pos/core/constants/constants.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_assets.dart';
// import 'package:mary_ai_pos/core/values/app_colors.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_svg/svg.dart';
// import 'package:scale_button/scale_button.dart';

// void showMyBottomSheet(BuildContext context, {required Widget child}) {
//   showModalBottomSheet(
//     context: context,
//     elevation: 0,
//     isScrollControlled: true,
//     enableDrag: true,
//     sheetAnimationStyle: const AnimationStyle(
//       curve: Curves.easeInCubic,
//       duration: kDefaultDuration300,
//     ),
//     barrierColor: Colors.black26,
//     backgroundColor: context.colors.bgDefault,
//     useSafeArea: true,
//     builder: (ctx) {
//       return SafeArea(
//         child: DecoratedBox(
//           decoration: BoxDecoration(
//             color: context.colors.bgDefault,
//             borderRadius: context.radius.bottomSheet,
//           ),
//           child: ClipRRect(
//             borderRadius: context.radius.bottomSheet,
//             child: SingleChildScrollView(
//               child: Column(
//                 mainAxisSize: MainAxisSize.min,
//                 crossAxisAlignment: CrossAxisAlignment.start,
//                 children: [
//                   19.verticalSpace,
//                   Align(
//                     alignment: Alignment.center,
//                     child: Container(
//                       height: (3),
//                       width: (40),
//                       decoration: BoxDecoration(
//                         color: AppColors.black.withOpacity(.8),
//                         borderRadius: context.radius.buttonMd,
//                       ),
//                     ),
//                   ),
//                   Align(
//                     alignment: Alignment.centerRight,
//                     child: ScaleButton(
//                       bound: 0.080,
//                       onTap: () => Navigator.pop(ctx),
//                       child: Container(
//                         height: (24),
//                         width: (24),
//                         decoration: BoxDecoration(
//                           shape: BoxShape.circle,
//                           color: context.colors.bgTritary,
//                         ),
//                         child: SvgPicture.asset(AppIcons.icXMark).paddingAll(4),
//                       ),
//                     ),
//                   ),
//                   16.verticalSpace,
//                   child,
//                 ],
//               ).paddingSymmetric(horizontal: (16)),
//             ),
//           ),
//         ),
//       ).paddingOnly(
//         bottom: customBottomPadding + MediaQuery.of(context).viewInsets.bottom,
//       );
//     },
//   );
// }
