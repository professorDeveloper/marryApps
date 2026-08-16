import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';

mixin FormValidationMixin<T extends StatefulWidget> on State<T> {
  Timer? _debounceTimer;
  final GlobalKey<FormState> formKey = GlobalKey<FormState>();
  final ValueNotifier<bool> formValidNotifier = ValueNotifier(false);

  @override
  void dispose() {
    _debounceTimer?.cancel();
    formValidNotifier.dispose();
    super.dispose();
  }

  void updateFormValidity() {
    _debounceTimer?.cancel();

    _debounceTimer = Timer(kDefaultDuration300, () {
      final form = formKey.currentState;
      if (form == null) return;

      final valid = form.validate();

      if (formValidNotifier.value != valid) {
        formValidNotifier.value = valid;
      }
    });
  }
}
