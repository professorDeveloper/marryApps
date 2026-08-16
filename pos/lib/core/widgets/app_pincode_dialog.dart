import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mary_ai_pos/core/auth/storage/token_storage_impl.dart';
import 'package:mary_ai_pos/core/values/app_colors.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

typedef PincodeValidator = FutureOr<bool> Function(String pin);

class AppPincodeDialog extends StatefulWidget {
  final String title;
  final String? subtitle;
  final int pinLength;
  final PincodeValidator onConfirm;

  const AppPincodeDialog({
    super.key,
    required this.title,
    required this.onConfirm,
    this.subtitle,
    this.pinLength = 4,
  });

  @override
  State<AppPincodeDialog> createState() => _AppPincodeDialogState();

  static Future<bool?> show(
    BuildContext context, {
    required PincodeValidator onConfirm,
    String? title,
    String? subtitle,
    int pinLength = 4,
  }) {
    return showDialog<bool>(
      context: context,
      barrierDismissible: true,
      barrierColor: AppColors.black.withOpacity(0.45),
      builder: (_) => AppPincodeDialog(
        title: title ?? S.current.strEnterPinCode,
        subtitle: subtitle,
        pinLength: pinLength,
        onConfirm: onConfirm,
      ),
    );
  }

  /// Convenience: validate against the locally stored last pincode.
  static Future<bool?> showWithStoredPin(
    BuildContext context, {
    String? title,
    String? subtitle,
  }) async {
    final storage = inject<AppTokenStorage>();
    final storedPin = await storage.readLastPincode();
    final length = (storedPin != null && storedPin.length == 6) ? 6 : 4;

    if (!context.mounted) return false;
    return show(
      context,
      title: title,
      subtitle: subtitle,
      pinLength: length,
      onConfirm: (entered) => storedPin != null && entered == storedPin,
    );
  }
}

class _AppPincodeDialogState extends State<AppPincodeDialog>
    with SingleTickerProviderStateMixin {
  String _pin = '';
  bool _verifying = false;
  bool _hasError = false;
  late final AnimationController _shakeCtrl;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    super.dispose();
  }

  Future<void> _onKey(String value) async {
    if (_verifying) return;

    if (value == '⌫') {
      if (_pin.isEmpty) return;
      setState(() {
        _pin = _pin.substring(0, _pin.length - 1);
        _hasError = false;
      });
      return;
    }

    if (_pin.length >= widget.pinLength) return;

    setState(() {
      _pin += value;
      _hasError = false;
    });

    if (_pin.length == widget.pinLength) {
      await _verify();
    }
  }

  Future<void> _verify() async {
    setState(() => _verifying = true);
    final ok = await widget.onConfirm(_pin);
    if (!mounted) return;
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      unawaited(HapticFeedback.heavyImpact());
      _shakeCtrl.forward(from: 0);
      setState(() {
        _pin = '';
        _hasError = true;
        _verifying = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(24),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: AnimatedBuilder(
            animation: _shakeCtrl,
            builder: (context, child) {
              final t = _shakeCtrl.value;
              final dx = t == 0 ? 0.0 : math.sin(t * math.pi * 6) * 14 * (1 - t);
              return Transform.translate(
                offset: Offset(dx, 0),
                child: child,
              );
            },
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.black.withOpacity(0.08),
                    blurRadius: 32,
                    offset: const Offset(0, 12),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _Header(
                      onClose: () => Navigator.of(context).pop(false),
                    ),
                    const SizedBox(height: 8),
                    _TitleBlock(
                      title: widget.title,
                      subtitle: widget.subtitle,
                    ),
                    const SizedBox(height: 24),
                    _PinDots(
                      length: widget.pinLength,
                      filled: _pin.length,
                      hasError: _hasError,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 20,
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 180),
                        child: _hasError
                            ? Text(
                                S.current.strIncorrectPincode,
                                key: const ValueKey('err'),
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.ffFB6633,
                                  fontFamily: 'Inter',
                                ),
                              )
                            : const SizedBox.shrink(key: ValueKey('ok')),
                      ),
                    ),
                    const SizedBox(height: 8),
                    _Keypad(
                      onTap: _onKey,
                      disabled: _verifying,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final VoidCallback onClose;
  const _Header({required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        InkResponse(
          onTap: onClose,
          radius: 22,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.black.withOpacity(0.04),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.close_rounded,
              size: 20,
              color: AppColors.black.withOpacity(0.6),
            ),
          ),
        ),
      ],
    );
  }
}

class _TitleBlock extends StatelessWidget {
  final String title;
  final String? subtitle;

  const _TitleBlock({required this.title, this.subtitle});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.ffFB6633.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          alignment: Alignment.center,
          child: const Icon(
            Icons.lock_outline_rounded,
            size: 28,
            color: AppColors.ffFB6633,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.black,
            fontFamily: 'Inter',
            letterSpacing: -0.2,
          ),
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 8),
          Text(
            subtitle!,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.black.withOpacity(0.55),
              fontFamily: 'Inter',
              height: 1.45,
            ),
          ),
        ],
      ],
    );
  }
}

class _PinDots extends StatelessWidget {
  final int length;
  final int filled;
  final bool hasError;

  const _PinDots({
    required this.length,
    required this.filled,
    required this.hasError,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(length, (i) {
        final isFilled = i < filled;
        final color = hasError
            ? AppColors.ffFB6633
            : (isFilled ? AppColors.ffFB6633 : AppColors.black.withOpacity(0.12));
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 140),
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isFilled ? color : AppColors.white,
              border: Border.all(color: color, width: 1.6),
            ),
          ),
        );
      }),
    );
  }
}

class _Keypad extends StatelessWidget {
  final ValueChanged<String> onTap;
  final bool disabled;

  const _Keypad({required this.onTap, required this.disabled});

  static const _keys = <String>[
    '1', '2', '3',
    '4', '5', '6',
    '7', '8', '9',
    '', '0', '⌫',
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.4,
      children: _keys.map((k) {
        if (k.isEmpty) {
          return const SizedBox.shrink();
        }
        return _KeyButton(
          label: k,
          onTap: disabled ? null : () => onTap(k),
        );
      }).toList(),
    );
  }
}

class _KeyButton extends StatefulWidget {
  final String label;
  final VoidCallback? onTap;

  const _KeyButton({required this.label, this.onTap});

  @override
  State<_KeyButton> createState() => _KeyButtonState();
}

class _KeyButtonState extends State<_KeyButton> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final isBackspace = widget.label == '⌫';
    return GestureDetector(
      onTapDown: widget.onTap == null
          ? null
          : (_) => setState(() => _pressed = true),
      onTapCancel: () => setState(() => _pressed = false),
      onTapUp: (_) => setState(() => _pressed = false),
      onTap: widget.onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 90),
        decoration: BoxDecoration(
          color: _pressed
              ? AppColors.ffFB6633.withOpacity(0.10)
              : AppColors.black.withOpacity(0.03),
          borderRadius: BorderRadius.circular(16),
        ),
        alignment: Alignment.center,
        child: isBackspace
            ? const Icon(
                Icons.backspace_outlined,
                size: 22,
                color: AppColors.black,
              )
            : Text(
                widget.label,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                  color: AppColors.black,
                  fontFamily: 'Inter',
                ),
              ),
      ),
    );
  }
}
