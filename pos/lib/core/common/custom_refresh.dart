// import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:flutter/material.dart';
// import 'package:pull_to_refresh/pull_to_refresh.dart';

// class CustomRefresh extends StatelessWidget {
//   final RefreshController controller;
//   final Widget? child;
//   final Widget? header;
//   final bool enabledRefresh;
//   final bool enabledNext;
//   final Function()? onNext;
//   final Function()? onRefresh;

//   const CustomRefresh({
//     super.key,
//     required this.controller,
//     this.child,
//     this.header,
//     this.enabledRefresh = true,
//     this.enabledNext = false,
//     this.onRefresh,
//     this.onNext,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return SmartRefresher(
//       controller: controller,
//       physics: const RangeMaintainingScrollPhysics(),
//       header:
//           header ??
//           WaterDropHeader(
//             complete: Icon(Icons.check, color: context.colors.bgBrand),
//             refresh: LoadingWidget(color: context.colors.bgBrand),
//           ),
//       enablePullDown: enabledRefresh,
//       enablePullUp: enabledNext,
//       onRefresh: onRefresh,
//       onLoading: onNext,
//       child: child,
//     );
//   }
// }
