// import 'package:animated_custom_dropdown/custom_dropdown.dart';
// import 'package:mary_ai_pos/core/common/custom_hover_effect_widget.dart';
// import 'package:mary_ai_pos/core/components/app_flush_bar.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_assets.dart';
// import 'package:mary_ai_pos/generated/l10n.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_svg/svg.dart';

// class CustomDropDownWidget extends StatelessWidget {
//   const CustomDropDownWidget({
//     super.key,
//     required this.list,
//     this.initialItem,
//     this.width,
//     this.hintText,
//     this.hintStyle,
//     this.padding,
//     this.borderColor,
//     this.bgColor,
//     this.enabled,
//     this.onChanged,
//     this.prefixIcon,
//     this.height,
//     this.onTap,
//   });

//   final bool? enabled;
//   final double? width;
//   final double? height;
//   final Color? bgColor;
//   final Color? borderColor;
//   final String? hintText;
//   final TextStyle? hintStyle;
//   final List<String> list;
//   final String? initialItem;
//   final EdgeInsets? padding;
//   final String? prefixIcon;
//   final Function()? onTap;
//   final Function(String)? onChanged;

//   @override
//   Widget build(BuildContext context) {
//     return GestureDetector(
//       onTap:
//           onTap ??
//           () {
//             if (list.isEmpty) {
//               showAppFlushbarMessage(
//                 context,
//                 msg: S.current.strNoDataFound,
//                 type: FlushbarType.warning,
//               );
//             }
//           },
//       child: ClipRRect(
//         borderRadius: context.radius.card,
//         child: Material(
//           shape: RoundedRectangleBorder(
//             borderRadius: context.radius.card,
//             side: BorderSide(
//               width: 2,
//               color: borderColor ?? context.colors.border,
//             ),
//           ),
//           child: SizedBox(
//             height: height,
//             width: width ?? 200,
//             child: CustomDropdown<String>(
//               items: list,
//               hintText: hintText,
//               onChanged: (onChanged == null)
//                   ? null
//                   : (String? value) {
//                       if (value != null) onChanged!(value);
//                     },
//               overlayHeight: height,
//               excludeSelected: false,
//               initialItem: initialItem,
//               hideSelectedFieldWhenExpanded: true,
//               expandedHeaderPadding: EdgeInsets.zero,
//               enabled: list.isEmpty ? false : enabled ?? true,
//               listItemBuilder: (context, title, isSelected, onItemSelect) {
//                 return CustomHoverEffectWidget(
//                   onTap: onItemSelect,
//                   borderRadius: context.radius.card,
//                   bgColor: isSelected
//                       ? context.colors.bgDefault
//                       : (bgColor ?? context.colors.bgSecondary),
//                   child: Row(
//                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
//                     children: [
//                       Expanded(
//                         child: Text(
//                           title,
//                           maxLines: 2,
//                           overflow: TextOverflow.ellipsis,
//                           style: context.textStyles.bodyMd.copyWith(
//                             color: context.colors.textDefault,
//                           ),
//                         ),
//                       ),
//                       if (isSelected) SvgPicture.asset(AppIcons.icCheck),
//                     ],
//                   ).paddingSymmetric(vertical: (10), horizontal: (16)),
//                 );
//               },

//               //! DISABLED DECORATION
//               disabledDecoration: CustomDropdownDisabledDecoration(
//                 suffixIcon: SvgPicture.asset(
//                   AppIcons.icArrowDown,
//                   colorFilter: ColorFilter.mode(
//                     context.colors.iconDefault,
//                     BlendMode.srcIn,
//                   ),
//                 ),
//                 fillColor: bgColor ?? context.colors.bgSecondary,
//               ),

//               //! ITEM PADDINGS
//               closedHeaderPadding:
//                   padding ??
//                   EdgeInsets.symmetric(vertical: (12), horizontal: (16)),
//               itemsListPadding: EdgeInsets.zero,
//               listItemPadding: const EdgeInsets.all(4),

//               decoration: CustomDropdownDecoration(
//                 //! TEXT STYLES
//                 hintStyle:
//                     hintStyle ??
//                     context.textStyles.bodyMd.copyWith(
//                       color: context.colors.textDefault,
//                     ),
//                 headerStyle: context.textStyles.bodyMd.copyWith(
//                   overflow: TextOverflow.ellipsis,
//                   color: context.colors.textDefault,
//                 ),

//                 //! CLOSED DECORATION
//                 prefixIcon: prefixIcon != null
//                     ? SvgPicture.asset(
//                         prefixIcon!,
//                         colorFilter: ColorFilter.mode(
//                           context.colors.iconDefault,
//                           BlendMode.srcIn,
//                         ),
//                       )
//                     : null,
//                 closedFillColor: bgColor ?? context.colors.bgSecondary,
//                 closedSuffixIcon: SvgPicture.asset(
//                   AppIcons.icArrowDown,
//                   colorFilter: ColorFilter.mode(
//                     context.colors.iconDefault,
//                     BlendMode.srcIn,
//                   ),
//                 ),

//                 //! EXPANDED DECORATION
//                 expandedBorderRadius: context.radius.card,
//                 expandedFillColor: bgColor ?? context.colors.bgSecondary,

//                 //! LIST ITEM DECORATION
//                 listItemDecoration: ListItemDecoration(
//                   splashColor: Colors.transparent,
//                   selectedColor: bgColor ?? context.colors.bgSecondary,
//                   selectedIconColor: context.colors.iconBrand,
//                   highlightColor: context.colors.bgBrand.withOpacity(.3),
//                 ),
//               ),
//             ),
//           ),
//         ),
//       ),
//     );
//   }
// }
