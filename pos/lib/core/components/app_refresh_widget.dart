// import 'package:flutter/material.dart';
// import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
// import 'package:mary_ai_pos/core/common/custom_refresh.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/generated/l10n.dart';
// import 'package:pull_to_refresh/pull_to_refresh.dart';

// class AppRefreshWidget extends StatefulWidget {
//   const AppRefreshWidget({
//     super.key,
//     required this.child,
//     required this.onRefresh,
//   });

//   final Widget child;
//   final Future<void> Function() onRefresh;

//   @override
//   State<AppRefreshWidget> createState() => _AppRefreshWidgetState();
// }

// class _AppRefreshWidgetState extends State<AppRefreshWidget> {
//   final RefreshController _refreshController = RefreshController();

//   @override
//   void dispose() {
//     _refreshController.dispose();
//     super.dispose();
//   }

//   @override
//   Widget build(BuildContext context) {
//     return CustomRefresh(
//       onRefresh: () async {
//         _refreshController.requestRefresh();
//         await widget.onRefresh();
//         _refreshController.refreshCompleted();
//       },
//       controller: _refreshController,
//       header: ClassicHeader(
//         iconPos: IconPosition.left,
//         refreshingIcon: SizedBox(
//           height: (20),
//           width: (20),
//           child: const LoadingWidget(),
//         ),
//         idleText: S.of(context).strPullDownToRefresh,
//         releaseText: S.of(context).strReleaseToRefresh,
//         refreshingText: S.of(context).strRefreshing,
//         completeText: S.of(context).strRefreshCompleted,
//         failedText: S.of(context).strRefreshFailed,
//       ),
//       child: widget.child,
//     );
//   }
// }
