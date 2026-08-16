// import 'dart:io' show Platform;

// import 'package:mary_ai_pos/core/extension/for_context.dart';
// import 'package:mary_ai_pos/core/extension/widget_extension.dart';
// import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
// import 'package:mary_ai_pos/core/utils/size_config.dart';
// import 'package:mary_ai_pos/core/values/app_colors.dart';
// import 'package:flutter/cupertino.dart';
// import 'package:flutter/material.dart';

// Future<DateTime?> showAppDatePicker(
//   BuildContext context, {
//   DateTime? initialDate,
//   DateTime? firstDate,
//   DateTime? lastDate,
// }) async {
//   initialDate = initialDate ?? lastDate;
//   firstDate ??= DateTime(1900);
//   lastDate ??= DateTime(2100, 12, 31);

//   if (Platform.isAndroid) {
//     final theme = Theme.of(context);

//     return await showDatePicker(
//       context: context,
//       initialDate: initialDate,
//       firstDate: firstDate,
//       lastDate: lastDate,
//       initialEntryMode: DatePickerEntryMode.calendarOnly,
//       builder: (context, child) {
//         return Theme(
//           data: theme.copyWith(
//             colorScheme: ColorScheme.light(
//               primary: context.colors.buttonBrand,
//               onPrimary: AppColors.white,
//               onSurface: context.colors.textDefault,
//               surface: context.colors.bgSecondary,
//             ),
//             textButtonTheme: TextButtonThemeData(
//               style: TextButton.styleFrom(
//                 foregroundColor: context.colors.buttonBrand,
//               ),
//             ),
//             dialogBackgroundColor: context.colors.bgSecondary,
//           ),
//           child: child!,
//         );
//       },
//     );
//   } else {
//     DateTime? selectedDate = initialDate;

//     await showCupertinoModalPopup<DateTime>(
//       context: context,
//       builder: (BuildContext builder) {
//         return Container(
//           height: 300,
//           color: context.colors.bgSecondary,
//           child: Column(
//             children: [
//               Row(
//                 spacing: (12),
//                 mainAxisAlignment: .spaceBetween,
//                 children: [
//                   CupertinoButton(
//                     child: const Text('Bekor qilish'),
//                     onPressed: () => Navigator.of(context).pop(),
//                   ),
//                   CupertinoButton(
//                     child: const Text('Tayyor'),
//                     onPressed: () => Navigator.of(context).pop(selectedDate),
//                   ),
//                 ],
//               ),
//               Expanded(
//                 child: CupertinoDatePicker(
//                   mode: CupertinoDatePickerMode.date,
//                   initialDateTime: initialDate,
//                   minimumDate: firstDate,
//                   maximumDate: lastDate,
//                   onDateTimeChanged: (DateTime newDate) {
//                     selectedDate = newDate;
//                   },
//                 ),
//               ),
//               customBottomPadding.verticalSpace,
//             ],
//           ),
//         );
//       },
//     );

//     return selectedDate;
//   }
// }
