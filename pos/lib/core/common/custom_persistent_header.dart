// import 'package:flutter/material.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';

// class PersistentHeader extends SliverPersistentHeaderDelegate {
//   final Widget widget;
//   final Color? color;
//   final double? height;
//   final EdgeInsetsGeometry? padding;
//   final BorderRadius? borderRadius;

//   final GlobalKey _key = GlobalKey();
//   double? _childHeight;

//   void _calculateHeight() {
//     WidgetsBinding.instance.addPostFrameCallback((_) {
//       final ctx = _key.currentContext;
//       if (ctx != null) {
//         final newHeight = ctx.size?.height;
//         if (newHeight != null && newHeight != _childHeight) {
//           _childHeight = newHeight;
//         }
//       }
//     });
//   }

//   PersistentHeader({
//     required this.widget,
//     this.color,
//     this.height,
//     this.padding,
//     this.borderRadius,
//   });

//   @override
//   Widget build(
//     BuildContext context,
//     double shrinkOffset,
//     bool overlapsContent,
//   ) {
//     _calculateHeight();

//     return Container(
//       padding: padding,
//       width: double.infinity,
//       decoration: BoxDecoration(
//         color: color ?? context.colors.bgDefault,
//         borderRadius: borderRadius,
//       ),
//       child: Center(child: widget),
//     );
//   }

//   @override
//   double get maxExtent => (height ?? 70) + (padding?.vertical ?? 0);

//   @override
//   double get minExtent => (height ?? 70) + (padding?.vertical ?? 0);

//   @override
//   bool shouldRebuild(SliverPersistentHeaderDelegate oldDelegate) {
//     return true;
//   }
// }
