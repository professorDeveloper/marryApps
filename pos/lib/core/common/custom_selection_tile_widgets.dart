// import 'package:mary_ai_pos/core/common/custom_loading_widget.dart';
// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:flutter/material.dart';
// import 'package:flutter_svg/flutter_svg.dart';
// import 'package:scale_button/scale_button.dart';

// class CustomSelectionTile extends StatelessWidget {
//   const CustomSelectionTile({
//     super.key,
//     required this.title,
//     this.leadingSvg,
//     this.leftW,
//     this.trailingWidget,
//     this.onTap,
//     this.isActive = false,
//     this.isLoading = false,
//     this.isEnabled = true,
//     this.showCheck = true,
//     this.borderRadius,
//     this.paddingV,
//     this.paddingH,
//     this.titleStyle,
//     this.iconColor,
//     this.bgColor,
//     this.borderColor,
//     this.activeBgColor,
//     this.disabledBgColor,
//     this.checkColor,
//     this.mainAxisAlignment,
//     this.maxLines,
//   });

//   final String title;
//   final String? leadingSvg;
//   final Widget? leftW;
//   final Widget? trailingWidget;
//   final Function()? onTap;
//   final bool isActive;
//   final bool isLoading;
//   final bool isEnabled;
//   final bool showCheck;
//   final double? paddingV;
//   final double? paddingH;
//   final TextStyle? titleStyle;
//   final Color? iconColor;
//   final Color? bgColor;
//   final Color? borderColor;
//   final Color? activeBgColor;
//   final Color? disabledBgColor;
//   final Color? checkColor;
//   final BorderRadius? borderRadius;
//   final MainAxisAlignment? mainAxisAlignment;
//   final int? maxLines;

//   @override
//   Widget build(BuildContext context) {
//     final bool tapEnabled = isEnabled && !isLoading && onTap != null;

//     return ScaleButton(
//       bound: 0.030,
//       onTap: tapEnabled ? onTap : null,
//       child: Material(
//         color: Colors.transparent,
//         child: InkWell(
//           onTap: tapEnabled ? onTap : null,
//           highlightColor: Colors.transparent,
//           splashColor: context.colors.textDefault.withOpacity(.08),
//           child: Ink(
//             decoration: BoxDecoration(
//               borderRadius: borderRadius,
//               color: isEnabled
//                   ? (isActive
//                         ? (activeBgColor ?? context.colors.bgDefault)
//                         : (bgColor ?? context.colors.bgDefault))
//                   : (disabledBgColor ?? context.colors.bgTritary),
//             ),
//             padding: EdgeInsets.symmetric(
//               vertical: (paddingV ?? 12),
//               horizontal: (paddingH ?? 12),
//             ),

//             child: Row(
//               mainAxisAlignment:
//                   mainAxisAlignment ?? MainAxisAlignment.spaceBetween,
//               crossAxisAlignment: CrossAxisAlignment.center,
//               children: [
//                 //! Leading area (widget or svg stack)
//                 Row(
//                   spacing: (12),
//                   children: [
//                     if (leftW != null)
//                       leftW!
//                     else if (leadingSvg != null)
//                       SvgPicture.asset(
//                         leadingSvg!,
//                         height: (28),
//                         width: (48),
//                         colorFilter: iconColor == null
//                             ? null
//                             : ColorFilter.mode(iconColor!, BlendMode.srcIn),
//                       )
//                     else
//                       const SizedBox.shrink(),

//                     //! Title
//                     LimitedBox(
//                       maxWidth: context.w * 0.55,
//                       child: Text(
//                         title,
//                         style: titleStyle ?? context.textStyles.bold16,
//                         overflow: TextOverflow.ellipsis,
//                         maxLines: maxLines ?? 2,
//                       ),
//                     ),
//                   ],
//                 ),

//                 //! Trailing area: loading / custom trailing / check
//                 Row(
//                   children: [
//                     if (isLoading)
//                       SizedBox(
//                         height: (25),
//                         width: (25),
//                         child: Center(
//                           child: LoadingWidget(
//                             color: context.colors.iconOnBrand,
//                           ),
//                         ),
//                       )
//                     else if (trailingWidget != null)
//                       trailingWidget!
//                     else if (isActive && showCheck)
//                       Radio(
//                         value: true,
//                         groupValue: isActive,

//                         activeColor: context.colors.iconBrand,
//                         onChanged: (value) {},
//                       )
//                     else
//                       const SizedBox.shrink(),
//                   ],
//                 ),
//               ],
//             ),
//           ),
//         ),
//       ),
//     );
//   }
// }
