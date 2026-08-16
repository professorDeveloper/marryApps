import 'package:flutter/material.dart';

final double customBottomPadding =
    MediaQuery.of(navigatorKey.currentState!.context).padding.bottom + 16;
final double customBarPadding = MediaQuery.of(
  navigatorKey.currentState!.context,
).padding.top;

final GlobalKey<NavigatorState> navigatorKey = GlobalKey();
