// import 'package:animate_do/animate_do.dart';
// import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_colors.dart';
// import 'package:flutter/material.dart';

// class InfiniteScrollingPagination extends StatelessWidget {
//   final Function() onPagination;
//   final Widget child;
//   final bool isLoading;

//   const InfiniteScrollingPagination({
//     super.key,
//     required this.onPagination,
//     required this.child,
//     this.isLoading = false,
//   });

//   @override
//   Widget build(BuildContext context) {
//     return NotificationListener<ScrollNotification>(
//       onNotification: (ScrollNotification scrollInfo) {
//         if (!isLoading &&
//             scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent &&
//             scrollInfo is UserScrollNotification) {
//           // if(scrollInfo.direction == ScrollDirection.reverse)
//           onPagination();
//           return false;
//         }
//         return false;
//       },
//       child: Column(
//         crossAxisAlignment: CrossAxisAlignment.stretch,
//         mainAxisAlignment: MainAxisAlignment.start,
//         mainAxisSize: MainAxisSize.min,
//         children: [
//           Expanded(child: child),
//           FadeIn(
//             duration: const Duration(milliseconds: 500),
//             child: SizedBox(
//                 height: isLoading ? 60 : 0,
//                 child: isLoading
//                     ? SizedBox(
//                         height: (36),
//                         width: (36),
//                         child: const Row(
//                           mainAxisAlignment: MainAxisAlignment.center,
//                           children: [
//                             LoadingWidget(color: AppColors.primaryColor)
//                           ],
//                         ),
//                       )
//                     : const SizedBox.shrink()),
//           ),
//         ],
//       ),
//     );
//   }
// }
