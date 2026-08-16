import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/services/license/trial_guard.dart';

/// Sinov muddati tugaganini bildiruvchi ekran.
///
/// Ataylab hech qanday dizayn sistemasiga bog'lanmagan (na POS'ning
/// `AppTheme`, na ofitsiant ilovasining `Ember`) — u ikkala ilovada ham,
/// tema yuklanmagan holatda ham bir xil chiqishi kerak.
class TrialLockScreen extends StatelessWidget {
  /// Qulf sababi. `null` bo'lsa — shu qurilmaning sinov muddati tugagan.
  /// Ofitsiant ilovasida POS qulflanganda POS bergan matn ko'rsatiladi.
  final String? reason;

  const TrialLockScreen({super.key, this.reason});

  @override
  Widget build(BuildContext context) {
    const bg = Color(0xFF14110F);
    const fg = Color(0xFFF2E9E4);
    const muted = Color(0xFF9A8F88);
    const accent = Color(0xFFE0653A);

    return Directionality(
      textDirection: TextDirection.ltr,
      child: Material(
        color: bg,
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 88,
                      height: 88,
                      decoration: BoxDecoration(
                        color: accent.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.lock_outline,
                        size: 44,
                        color: accent,
                      ),
                    ),
                    const SizedBox(height: 28),
                    const Text(
                      'Contact to developer',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: fg,
                        fontSize: 26,
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text(
                      reason ?? 'Sinov muddati tugadi.\nIlovadan foydalanishni '
                          'davom ettirish uchun ishlab chiquvchiga murojaat '
                          'qiling.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: muted,
                        fontSize: 15,
                        height: 1.5,
                      ),
                    ),
                    if (TrialGuard.contact.isNotEmpty) ...[
                      const SizedBox(height: 26),
                      const SelectableText(
                        TrialGuard.contact,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: accent,
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
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

/// Qulflangan holatda butun ilovani [TrialLockScreen] bilan almashtiradi.
///
/// `Stack` ustiga qo'yish emas, **almashtirish**: ostidagi daraxt qolsa
/// klaviatura yorliqlari, fokus va gesture'lar unga yetib borishi mumkin edi.
///
/// `MaterialApp.builder` ichida ishlatiladi — shunda u har bir route ustidan
/// tushadi va navigatsiya bilan chetlab o'tib bo'lmaydi.
class TrialGate extends StatefulWidget {
  final TrialGuard guard;

  /// Tashqi sabab bilan qulflash (ofitsiant ilovasida POS 423 qaytarganda).
  final Stream<String>? externalLock;

  final Widget child;

  const TrialGate({
    super.key,
    required this.guard,
    required this.child,
    this.externalLock,
  });

  @override
  State<TrialGate> createState() => _TrialGateState();
}

class _TrialGateState extends State<TrialGate> {
  StreamSubscription<bool>? _sub;
  StreamSubscription<String>? _externalSub;
  late bool _locked = widget.guard.isLocked;
  String? _reason;

  @override
  void initState() {
    super.initState();
    _sub = widget.guard.onLockChanged.listen((locked) {
      if (!mounted || !locked) return;
      setState(() => _locked = true);
    });
    _externalSub = widget.externalLock?.listen((reason) {
      if (!mounted) return;
      setState(() {
        _locked = true;
        _reason = reason.isEmpty ? null : reason;
      });
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    _externalSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_locked) return widget.child;
    return TrialLockScreen(reason: _reason);
  }
}
