// import 'package:mary_ai_pos/core/values/app_colors.dart';
// import 'package:flutter/material.dart';
// import 'package:mary_ai_pos/core/common/custom_button.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_assets.dart';

// class CustomAppBar extends StatelessWidget implements PreferredSizeWidget {
//   final String title;
//   final String? leftIcon;
//   final bool isCenter;
//   final bool hasShadow;
//   final List<Widget>? action;
//   final String? rightIcon;
//   final Function()? leftOnTap;
//   final Function()? rightOnTap;
//   final Color? rightIconColor;
//   final Color? rightBgColor;
//   final TextStyle? titleStyle;

//   const CustomAppBar({
//     super.key,
//     this.hasShadow = true,
//     required this.title,
//     this.action,
//     this.leftOnTap,
//     this.rightIcon,
//     this.rightOnTap,
//     this.rightBgColor,
//     this.rightIconColor,
//     this.isCenter = true,
//     this.leftIcon = AppIcons.icArrowLeft,
//     this.titleStyle,
//   }) : preferredSize = const Size.fromHeight(60);

//   @override
//   final Size preferredSize;

//   @override
//   Widget build(BuildContext context) {
//     return PreferredSize(
//       preferredSize: preferredSize,
//       child: DecoratedBox(
//         decoration: BoxDecoration(
//           boxShadow: (!context.hasDark && hasShadow)
//               ? [
//                   BoxShadow(
//                     blurRadius: 18,
//                     spreadRadius: 1,
//                     offset: const Offset(0, 2),
//                     color: AppColors.black.withValues(alpha: 0.07),
//                   ),
//                 ]
//               : null,
//         ),
//         child: AppBar(
//           titleSpacing: (16),
//           scrolledUnderElevation: 0.0,
//           centerTitle: isCenter,
//           toolbarHeight: (60),
//           automaticallyImplyLeading: false,
//           leadingWidth: (80),
//           bottom: PreferredSize(
//             preferredSize: preferredSize,
//             child: SizedBox(height: (12)),
//           ),
//           title: Text(
//             title,
//             style:
//                 titleStyle ??
//                 context.textStyles.bold18.copyWith(
//                   color: context.colors.iconDefault,
//                 ),
//           ),
//           leading: leftIcon != null
//               ? CustomIconButton(
//                   radius: 14,
//                   borderColor: context.colors.bgDefault,
//                   bgColor: context.colors.bgDefault,
//                   onTap: leftOnTap ?? () => Navigator.pop(context),
//                   icon: leftIcon,
//                   iconcolor: context.colors.iconDefault,
//                 ).paddingSymmetric(horizontal: (17))
//               : null,
//           actions:
//               action ??
//               [
//                 rightIcon != null
//                     ? CustomIconButton(
//                         radius: 14,
//                         heightIcon: (19),
//                         borderColor: rightBgColor ?? context.colors.bgSecondary,
//                         bgColor:
//                             rightBgColor ?? context.colors.bgDefaultTritary,
//                         onTap: rightOnTap ?? () {},
//                         icon: rightIcon,
//                         iconcolor: rightIconColor ?? context.colors.iconDefault,
//                       ).paddingSymmetric(horizontal: (17))
//                     : const SizedBox.shrink(),
//               ],
//         ),
//       ),
//     );
//   }
// }
