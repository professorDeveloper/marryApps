// import 'package:mary_ai_pos/core/constants/constants.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_colors.dart';
// import 'package:flutter/material.dart';

// class AppSwitchTabBarComponent extends StatelessWidget {
//   final List<String> tabs;
//   final TabController tabController;

//   const AppSwitchTabBarComponent({
//     super.key,
//     required this.tabs,
//     required this.tabController,
//   });

//   @override
//   Widget build(BuildContext context) {
//     final double fullWidth = MediaQuery.of(context).size.width * 0.9;
//     final double tabWidth = fullWidth / tabs.length;

//     return Container(
//       height: (40),
//       width: double.infinity,
//       padding: const EdgeInsets.all(3.5),
//       decoration: BoxDecoration(
//         borderRadius: context.radius.segmentedControl,
//         color: context.colors.bgSecondary,
//       ),
//       child: Stack(
//         children: [
//           AnimatedAlign(
//             curve: Curves.easeInOut,
//             duration: kDefaultDuration300,
//             alignment: Alignment(
//               (tabController.index / (tabs.length - 1)) * 2 - 1,
//               0,
//             ),
//             child: Container(
//               height: (33),
//               width: tabWidth,
//               decoration: BoxDecoration(
//                 color: context.colors.bgDefault,
//                 borderRadius: BorderRadius.circular(16),
//                 boxShadow: context.hasDark
//                     ? null
//                     : [
//                         BoxShadow(
//                           color: AppColors.black.withOpacity(.06),
//                           blurRadius: 4,
//                         ),
//                       ],
//               ),
//             ),
//           ),
//           Row(
//             children: List.generate(tabs.length, (index) {
//               return Expanded(
//                 child: GestureDetector(
//                   behavior: .opaque,
//                   onTap: () => tabController.animateTo(index),
//                   child: Center(
//                     child: AnimatedDefaultTextStyle(
//                       duration: kDefaultDuration300,
//                       style: context.textStyles.bodySm.copyWith(
//                         color: tabController.index == index
//                             ? context.colors.textDefault
//                             : context.colors.textTertiary,
//                         fontWeight: FontWeight.w500,
//                       ),
//                       child: Text(tabs[index]),
//                     ),
//                   ),
//                 ),
//               );
//             }),
//           ),
//         ],
//       ),
//     );
//   }
// }
