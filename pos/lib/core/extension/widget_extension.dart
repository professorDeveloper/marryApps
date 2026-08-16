import 'package:flutter/material.dart';

/// add Padding Property to widget
extension WidgetPaddingX on Widget {
  Widget paddingAll(double padding) =>
      Padding(padding: EdgeInsets.all(padding), child: this);

  Widget paddingSymmetric({double horizontal = 0.0, double vertical = 0.0}) =>
      Padding(
        padding: EdgeInsets.symmetric(
          horizontal: horizontal,
          vertical: vertical,
        ),
        child: this,
      );

  Widget paddingOnly({
    double left = 0.0,
    double top = 0.0,
    double right = 0.0,
    double bottom = 0.0,
  }) => Padding(
    padding: EdgeInsets.only(
      top: top,
      left: left,
      right: right,
      bottom: bottom,
    ),
    child: this,
  );

  Widget get paddingZero => Padding(padding: EdgeInsets.zero, child: this);
}

/// Allows you to insert widgets inside a CustomScrollView
extension WidgetSliverBoxX on Widget {
  Widget get sliverBox => SliverToBoxAdapter(child: this);
}

class NewList<T> {
  final List l;

  NewList(this.l);

  List<T> list() {
    var l = List<T>.from((this.l as List<T>).toList());
    return l;
  }
}

/// Allows add horizontal and vertical space between widgets
extension SizedBoxExtension on num {
  SizedBox get verticalSpace => SizedBox(height: (toDouble()));
  SizedBox get horizontalSpace => SizedBox(width: (toDouble()));
}
