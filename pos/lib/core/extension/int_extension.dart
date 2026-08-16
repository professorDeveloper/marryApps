import 'package:flutter/material.dart';

int parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? 0;
  return 0;
}

extension IntExtension on int {
  Widget get wBox => SizedBox(width: toDouble());

  Widget get hBox => SizedBox(height: toDouble());
}
