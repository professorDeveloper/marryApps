// import 'package:animate_do/animate_do.dart';
// import 'package:flutter/material.dart';
// import 'package:mary_ai_pos/core/common/custom_button.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/generated/l10n.dart';

// void showConfirmationDialog(
//   BuildContext context, {
//   required Function onTap,
//   required String title,
//   required String description,
// }) {
//   showDialog(
//     context: context,
//     barrierDismissible: false,
//     builder: (context) {
//       return FadeIn(
//         child: Dialog(
//           shape: RoundedRectangleBorder(
//             borderRadius: BorderRadius.circular(16),
//           ),
//           insetPadding: EdgeInsets.symmetric(horizontal: (24)),
//           child: Container(
//             padding: const EdgeInsets.all(16),
//             decoration: BoxDecoration(
//               color: context.colors.bgDefault,
//               borderRadius: BorderRadius.circular(16),
//             ),
//             child: Column(
//               mainAxisSize: MainAxisSize.min,
//               crossAxisAlignment: CrossAxisAlignment.start,
//               children: [
//                 Text(title, style: context.textStyles.headingSm),
//                 12.verticalSpace,
//                 Text(description, style: context.textStyles.bodySm),
//                 40.verticalSpace,
//                 Row(
//                   children: [
//                     Expanded(
//                       child: CustomButton(
//                         text: S.of(context).strNo,
//                         bgColor: context.colors.bgSecondary,
//                         textColor: context.colors.textDefault,
//                         onTap: () => Navigator.pop(context),
//                       ),
//                     ),
//                     16.horizontalSpace,
//                     Expanded(
//                       child: CustomButton(
//                         text: S.of(context).strYes,
//                         onTap: () {
//                           Navigator.pop(context);
//                           onTap();
//                         },
//                       ),
//                     ),
//                   ],
//                 ),
//               ],
//             ),
//           ),
//         ),
//       );
//     },
//   );
// }
