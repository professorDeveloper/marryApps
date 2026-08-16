// import 'package:flutter/material.dart';
// import 'package:flutter_svg/svg.dart';
// import 'package:mary_ai_pos/core/common/custom_button.dart';
// import 'package:mary_ai_pos/core/common/custom_text_field.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_assets.dart';
// import 'package:scale_button/scale_button.dart';

// class AppSearchAppBarComponent extends StatelessWidget
//     implements PreferredSizeWidget {
//   final String title;
//   final String? hintText;
//   final VoidCallback? onClear;
//   final FocusNode searchFocus;
//   final ValueChanged<String> onChanged;
//   final TextEditingController searchController;
//   final ValueNotifier<bool> searchModeNotifier;

//   const AppSearchAppBarComponent({
//     super.key,
//     this.onClear,
//     this.hintText,
//     required this.title,
//     required this.onChanged,
//     required this.searchFocus,
//     required this.searchModeNotifier,
//     required this.searchController,
//   }) : preferredSize = const Size.fromHeight(70);

//   @override
//   final Size preferredSize;

//   @override
//   Widget build(BuildContext context) {
//     return AppBar(
//       elevation: 0,
//       leadingWidth: 0,
//       toolbarHeight: (70),
//       scrolledUnderElevation: 0.0,
//       automaticallyImplyLeading: false,
//       shape: RoundedRectangleBorder(borderRadius: context.radius.topBar),
//       flexibleSpace: SafeArea(
//         child: ValueListenableBuilder<bool>(
//           valueListenable: searchModeNotifier,
//           builder: (context, isSearchMode, _) {
//             return Row(
//               spacing: (8),
//               crossAxisAlignment: CrossAxisAlignment.stretch,
//               children: [
//                 AnimatedSwitcher(
//                   duration: const Duration(milliseconds: 200),
//                   transitionBuilder: (child, anim) {
//                     return FadeTransition(
//                       opacity: anim,
//                       child: ScaleTransition(scale: anim, child: child),
//                     );
//                   },
//                   child: CustomIconButton(
//                     radius: 14,
//                     paddingV: 2,
//                     heightIcon: (19),
//                     icon: AppIcons.icArrowLeft,
//                     onTap: () => Navigator.pop(context),
//                     borderColor: context.colors.bgSecondary,
//                     bgColor: context.colors.bgDefaultTritary,
//                     iconcolor: context.colors.iconDefault,
//                   ),
//                 ),
//                 Expanded(
//                   child: AnimatedSwitcher(
//                     duration: const Duration(milliseconds: 250),
//                     switchInCurve: Curves.easeOut,
//                     switchOutCurve: Curves.easeIn,
//                     transitionBuilder: (child, anim) {
//                       return FadeTransition(
//                         opacity: anim,
//                         child: ScaleTransition(scale: anim, child: child),
//                       );
//                     },
//                     child:
//                         isSearchMode
//                             ? CustomTextField(
//                               borderRadius: 14,
//                               focusNode: searchFocus,
//                               key: const ValueKey('search_field'),
//                               contentPadding: EdgeInsets.symmetric(
//                                 horizontal: (12),
//                                 vertical: (10),
//                               ),
//                               textEditingController: searchController,
//                               hintText: hintText ?? "",
//                               prefixIcon: AppIcons.icSearch,
//                               suffixIcon: StatefulBuilder(
//                                 builder: (context, setState) {
//                                   return Offstage(
//                                     offstage: searchController.text.isEmpty,
//                                     child: ScaleButton(
//                                       bound: 0.08,
//                                       onTap: () {
//                                         setState(() {
//                                           onClear?.call();
//                                           searchController.clear();
//                                         });
//                                       },
//                                       child: SvgPicture.asset(
//                                         AppIcons.icXMark,
//                                       ).marginOnly(right: (12)),
//                                     ),
//                                   );
//                                 },
//                               ),
//                               borderColor: context.colors.bgDefaultTritary,
//                               preIconColor: context.colors.iconTertiary,
//                               fillColor: context.colors.bgDefaultTritary,
//                               textInputType: TextInputType.text,
//                               onChange: onChanged,
//                             )
//                             : Center(
//                               key: const ValueKey('title_text'),
//                               child: Text(
//                                 title,
//                                 style: context.textStyles.bold18,
//                                 textAlign: TextAlign.center,
//                                 overflow: TextOverflow.ellipsis,
//                               ),
//                             ),
//                   ),
//                 ),
//                 AnimatedSwitcher(
//                   duration: const Duration(milliseconds: 200),
//                   transitionBuilder: (child, anim) {
//                     return FadeTransition(
//                       opacity: anim,
//                       child: ScaleTransition(scale: anim, child: child),
//                     );
//                   },
//                   child: CustomIconButton(
//                     key: ValueKey(isSearchMode),
//                     radius: 14,
//                     heightIcon: (19),
//                     icon: isSearchMode ? AppIcons.icXMark : AppIcons.icSearch,
//                     iconcolor:
//                         searchController.text.isEmpty
//                             ? context.colors.iconTertiary
//                             : context.colors.iconDefault,
//                     borderColor: context.colors.bgSecondary,
//                     bgColor: context.colors.bgDefaultTritary,
//                     onTap: () {
//                       if (!isSearchMode) {
//                         searchFocus.requestFocus();
//                         searchController.clear();
//                       }
//                       searchModeNotifier.value = !searchModeNotifier.value;
//                     },
//                   ),
//                 ),
//               ],
//             ).paddingSymmetric(horizontal: (16));
//           },
//         ),
//       ),
//     );
//   }
// }
