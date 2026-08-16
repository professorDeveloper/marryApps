// import 'package:flutter/material.dart';
// import 'package:mary_ai_pos/core/common/custom_button.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_colors.dart';

// Future<dynamic> showConfirmationBottomSheet(
//   BuildContext context, {
//   Color? primaryColor,
//   required String icon,
//   required String title,
//   required String subtitle,
//   required String buttonText,
//   bool buttonLoading = false,
//   required Function() onButtonTap,
// }) {
//   return showModalBottomSheet(
//     context: context,
//     isDismissible: false,
//     backgroundColor: Colors.transparent,
//     builder: (ctx) {
//       return Container(
//         width: context.w,
//         padding: const EdgeInsets.all(16),
//         margin: EdgeInsets.symmetric(horizontal: (16), vertical: (40)),
//         decoration: BoxDecoration(
//           color: context.colors.bgDefault,
//           borderRadius: context.radius.card,
//         ),
//         child: Column(
//           crossAxisAlignment: .center,
//           mainAxisSize: MainAxisSize.min,
//           children: [
//             CustomIconButton(
//               paddingV: 5,
//               icon: icon,
//               heightIcon: 24,
//               bgColor: primaryColor,
//               borderColor: primaryColor,
//               iconcolor: AppColors.white,
//             ),
//             16.verticalSpace,
//             Text(title, style: context.textStyles.semibold16),
//             4.verticalSpace,
//             Text(
//               subtitle,
//               style: context.textStyles.caption,
//               textAlign: TextAlign.center,
//             ),
//             24.verticalSpace,
//             Row(
//               spacing: (8),
//               children: [
//                 Expanded(
//                   child: CustomButton(
//                     text: "S.current.strCancel",
//                     bgColor: context.colors.bgTritary,
//                     borderColor: context.colors.bgTritary,
//                     textColor: context.colors.textTertiary,
//                     onTap: () => Navigator.pop(context),
//                   ),
//                 ),
//                 Expanded(
//                   child: CustomButton(
//                     text: buttonText,
//                     bgColor: primaryColor,
//                     isLoading: buttonLoading,
//                     borderColor: primaryColor,
//                     onTap: () {
//                       Navigator.pop(ctx);
//                       onButtonTap();
//                     },
//                   ),
//                 ),
//               ],
//             ),
//           ],
//         ),
//       );
//     },
//   );
// }
