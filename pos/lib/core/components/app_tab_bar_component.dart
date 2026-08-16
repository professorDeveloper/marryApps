// import 'package:flutter/material.dart';
// import 'package:mary_ai_pos/core/common/custom_button.dart';
// import 'package:mary_ai_pos/core/constants/constants.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';

// class AppTabBarComponent extends StatelessWidget {
//   final bool isActive;
//   final Function(int index)? onTap;
//   final List<String> tabs;
//   final TabController controller;
//   final EdgeInsetsGeometry? padding;
//   final ScrollController? scrollController;
//   final double? paddingTop;
//   final double? paddingBottom;

//   const AppTabBarComponent({
//     super.key,
//     this.onTap,
//     this.padding,
//     required this.tabs,
//     this.isActive = true,
//     this.scrollController,
//     required this.controller,
//     this.paddingTop,
//     this.paddingBottom,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return SizedBox(
//       height: (36),
//       child: ListView.separated(
//         controller: scrollController,
//         scrollDirection: Axis.horizontal,
//         padding: padding ?? EdgeInsets.symmetric(horizontal: (16)),
//         separatorBuilder: (context, index) => 10.horizontalSpace,
//         itemBuilder: (context, tabIndex) {
//           final key = GlobalKey();
//           final isSelected = controller.index == tabIndex;
//           return SizedBox(
//             key: key,
//             child: CustomButton(
//               isActive: isActive,
//               height: (36),
//               fontSize: 14,
//               paddingV: 8,
//               paddingH: 16,
//               bgColor: isSelected
//                   ? context.colors.buttonBrand
//                   : context.colors.buttonSecondary,
//               text: tabs[tabIndex],
//               textColor: isSelected
//                   ? context.colors.textOnBrand
//                   : context.colors.textDefault,
//               onTap: () {
//                 onTap?.call(tabIndex);
//                 controller.index = tabIndex;
//                 Scrollable.ensureVisible(
//                   key.currentContext!,
//                   alignment: 0.5,
//                   curve: Curves.linearToEaseOut,
//                   duration: kDefaultDuration300,
//                 );
//               },
//             ),
//           );
//         },
//         itemCount: tabs.length,
//       ),
//     ).paddingOnly(top: paddingTop ?? (16), bottom: paddingBottom ?? (8));
//   }
// }
