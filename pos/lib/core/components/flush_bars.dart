import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

/// Overlay'ni topishning ishonchli yo'li. Ba'zi context'lar (masalan
/// `navigatorKey.currentContext`) Overlay'ning ustida turadi va
/// `Overlay.maybeOf(ctx)` null qaytaradi. Shuning uchun avval global
/// navigator overlay'ni sinab ko'ramiz, kerak bo'lsa context dan izlaymiz.
OverlayState? _resolveOverlay(BuildContext? bc) {
  final fromNav = navigatorKey.currentState?.overlay;
  if (fromNav != null) return fromNav;
  if (bc == null) return null;
  return Overlay.maybeOf(bc, rootOverlay: true);
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium animated error toast — 4s auto-dismiss, spring slide-in from top.
// HTML belgilari tozalanadi, uzun matn qisqartiriladi.
// ─────────────────────────────────────────────────────────────────────────────

String _sanitizeErrorText(String raw) {
  var s = raw.trim();
  // HTML tags olib tashlash
  s = s.replaceAll(RegExp(r'<[^>]*>'), ' ');
  // HTML entitylar
  s = s
      .replaceAll('&nbsp;', ' ')
      .replaceAll('&amp;', '&')
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>')
      .replaceAll('&quot;', '"');
  // Ortiqcha bo'shliqlar
  s = s.replaceAll(RegExp(r'\s+'), ' ').trim();
  final low = s.toLowerCase();
  // Dio'ning verbose exception matnini ushlab, foydalanuvchiga ko'rsatmaymiz
  final isDioVerbose =
      low.contains('this exception was thrown because the response has a status code') ||
      low.contains('validatestatus was configured to throw') ||
      low.contains('dioexception');
  // Status code'larini matndan ajratamiz
  final codeMatch = RegExp(r'status code of (\d{3})').firstMatch(low) ??
      RegExp(r'\b(5\d{2}|4\d{2})\b').firstMatch(low);
  final code = codeMatch?.group(1);

  // Aniq status code asosida tarjimalangan xabar
  if (code == '502' || low.contains('bad gateway')) {
    return S.current.strServerUnreachable502;
  }
  if (code == '504' || low.contains('gateway timeout')) {
    return S.current.strServerUnreachable504;
  }
  if (code == '503' || low.contains('service unavailable')) {
    return S.current.strServerUnreachable503;
  }
  if (code == '500' || low.contains('internal server error')) {
    return S.current.strServerUnreachable500;
  }
  // Dio verbose xabarini fallback xabarga aylantiramiz
  if (isDioVerbose) {
    return S.current.strServerUnreachableGeneric;
  }
  // Umumiy holat: 200 belgidan uzun bo'lsa — qisqartirish
  if (s.length > 200) return '${s.substring(0, 197)}…';
  return s;
}

void showErrorMessage(BuildContext bc, String error, {int duration = 4}) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    final overlay = _resolveOverlay(bc);
    if (overlay == null) return;
    final sanitized = _sanitizeErrorText(error);
    _ToastController.show(
      overlay: overlay,
      message: sanitized,
      variant: _ToastVariant.error,
      autoDismissMs: duration * 1000,
    );
  });
}

/// Sarlavha + paragraflar — premium overlay style, top-right.
/// Auto-dismiss qiladi (printer xatolari kabi xabarlar uchun ham), shu bilan birga
/// X tugmasi yoki yuqoriga sudrash orqali tezroq yopilishi mumkin.
void showStructuredErrorDismissible(
  BuildContext context, {
  required String title,
  List<String> paragraphs = const [],
  IconData icon = Icons.error_outline_rounded,
  int durationSec = 6,
}) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    final overlay = _resolveOverlay(context);
    if (overlay == null) return;
    _ToastController.show(
      overlay: overlay,
      message: paragraphs.isEmpty ? title : paragraphs.join('\n\n'),
      variant: _ToastVariant.error,
      autoDismissMs: durationSec * 1000,
    );
  });
}

/// X tugmasi bilan yopiladi; avtomatik yo‘qolmaydi (printer xatolari kabi).
/// Uzun matn: birinchi qator sarlavha, qolgani paragraflar sifatida.
void showErrorMessageDismissible(BuildContext context, String message) {
  final trimmed = message.trim();
  final idx = trimmed.indexOf('\n');
  if (idx <= 0) {
    showStructuredErrorDismissible(
      context,
      title: S.current.strError,
      paragraphs: trimmed.isEmpty ? const [] : [trimmed],
      icon: Icons.error_outline_rounded,
    );
    return;
  }
  final head = trimmed.substring(0, idx).trim();
  final tail = trimmed.substring(idx + 1).trim();
  final parts = tail
      .split(RegExp(r'\n\s*\n'))
      .map((e) => e.trim())
      .where((e) => e.isNotEmpty)
      .toList();
  showStructuredErrorDismissible(
    context,
    title: head.isEmpty ? S.current.strError : head,
    paragraphs: parts,
    icon: Icons.error_outline_rounded,
  );
}

void showSuccessMessage(BuildContext bc, String success, {int duration = 4}) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    final overlay = _resolveOverlay(bc);
    if (overlay == null) return;
    _ToastController.show(
      overlay: overlay,
      message: success,
      variant: _ToastVariant.success,
      autoDismissMs: duration * 1000,
    );
  });
}

void showInfoMessage(BuildContext bc, String info, {int duration = 4}) {
  WidgetsBinding.instance.addPostFrameCallback((_) {
    final overlay = _resolveOverlay(bc);
    if (overlay == null) return;
    _ToastController.show(
      overlay: overlay,
      message: info,
      variant: _ToastVariant.info,
      autoDismissMs: duration * 1000,
    );
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// PREMIUM TOAST WIDGET
// ═════════════════════════════════════════════════════════════════════════════

enum _ToastVariant { error, success, info }

class _ToastPalette {
  final Color bg;
  final Color bgHighlight; // top inner highlight (1px soft line)
  final Color border;
  final Color iconBg;
  final Color accent;
  final IconData icon;
  final String title;

  const _ToastPalette({
    required this.bg,
    required this.bgHighlight,
    required this.border,
    required this.iconBg,
    required this.accent,
    required this.icon,
    required this.title,
  });

  static _ToastPalette of(_ToastVariant v) {
    // Desaturated, premium palettes — no pure red/green/blue, matches Zinc base.
    switch (v) {
      case _ToastVariant.error:
        return const _ToastPalette(
          bg: Color(0xFF171214), // Zinc-950 tinted warm
          bgHighlight: Color(0x14FFFFFF),
          border: Color(0x26E05B5B),
          iconBg: Color(0x1FE05B5B),
          accent: Color(0xFFE05B5B), // desaturated rose
          icon: Icons.error_outline_rounded,
          title: 'Xatolik',
        );
      case _ToastVariant.success:
        return const _ToastPalette(
          bg: Color(0xFF0F1613),
          bgHighlight: Color(0x14FFFFFF),
          border: Color(0x2634D399),
          iconBg: Color(0x1F34D399),
          accent: Color(0xFF34D399),
          icon: Icons.check_circle_outline_rounded,
          title: 'Muvaffaqiyatli',
        );
      case _ToastVariant.info:
        return const _ToastPalette(
          bg: Color(0xFF101319),
          bgHighlight: Color(0x14FFFFFF),
          border: Color(0x2660A5FA),
          iconBg: Color(0x1F60A5FA),
          accent: Color(0xFF60A5FA),
          icon: Icons.info_outline_rounded,
          title: "Ma'lumot",
        );
    }
  }
}

/// Toast'larni boshqaradigan static controller — ekranda bir nechta bo'lib ketishining
/// oldini oladi va yangisi kelganda eskisini darhol o'chiradi.
class _ToastController {
  static OverlayEntry? _currentEntry;
  static _ToastWidgetState? _currentState;

  static void show({
    required OverlayState overlay,
    required String message,
    required _ToastVariant variant,
    required int autoDismissMs,
  }) {
    // Avvalgi toast bo'lsa — darhol animatsiya bilan yopamiz
    _currentState?.dismiss();

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (context) => _ToastWidget(
        message: message,
        variant: variant,
        autoDismissMs: autoDismissMs,
        onStateCreated: (s) => _currentState = s,
        onRemoved: () {
          if (_currentEntry == entry) {
            _currentEntry = null;
            _currentState = null;
          }
          if (entry.mounted) entry.remove();
        },
      ),
    );
    _currentEntry = entry;
    overlay.insert(entry);
  }
}

class _ToastWidget extends StatefulWidget {
  final String message;
  final _ToastVariant variant;
  final int autoDismissMs;
  final ValueChanged<_ToastWidgetState> onStateCreated;
  final VoidCallback onRemoved;

  const _ToastWidget({
    required this.message,
    required this.variant,
    required this.autoDismissMs,
    required this.onStateCreated,
    required this.onRemoved,
  });

  @override
  State<_ToastWidget> createState() => _ToastWidgetState();
}

class _ToastWidgetState extends State<_ToastWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _slide;
  late final Animation<double> _fade;
  Timer? _dismissTimer;
  bool _dismissing = false;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
      reverseDuration: const Duration(milliseconds: 280),
    );
    // Custom spring-like cubic-bezier (slightly over-shoot feel)
    _slide = CurvedAnimation(
      parent: _ctrl,
      curve: const Cubic(0.22, 1.12, 0.36, 1),
      reverseCurve: const Cubic(0.4, 0, 1, 1),
    );
    _fade = CurvedAnimation(
      parent: _ctrl,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    );

    widget.onStateCreated(this);
    _ctrl.forward();
    _dismissTimer = Timer(
      Duration(milliseconds: widget.autoDismissMs),
      dismiss,
    );
  }

  Future<void> dismiss() async {
    if (_dismissing || !mounted) return;
    _dismissing = true;
    _dismissTimer?.cancel();
    try {
      await _ctrl.reverse();
    } catch (_) {}
    if (!mounted) return;
    widget.onRemoved();
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _ctrl.dispose();
    super.dispose();
  }

  // Swipe-up tracking
  double _dragDy = 0;

  void _onDragUpdate(DragUpdateDetails d) {
    if (_dismissing) return;
    // Faqat tepaga sudrashga ruxsat (dy < 0)
    _dragDy = (_dragDy + d.delta.dy).clamp(-160.0, 0.0);
    if (mounted) setState(() {});
  }

  void _onDragEnd(DragEndDetails d) {
    if (_dismissing) return;
    final flickedUp = d.velocity.pixelsPerSecond.dy < -400;
    if (_dragDy < -56 || flickedUp) {
      dismiss();
    } else {
      // Joyiga qaytarish
      _dragDy = 0;
      if (mounted) setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final palette = _ToastPalette.of(widget.variant);
    final media = MediaQuery.of(context);
    // Desktop: top-right (460px max). Mobile: top-center with padding.
    final isWide = media.size.width >= 720;

    return Positioned(
      top: media.padding.top + 20,
      left: isWide ? null : 16,
      right: isWide ? 24 : 16,
      child: SafeArea(
        bottom: false,
        child: AnimatedBuilder(
          animation: _ctrl,
          builder: (context, child) {
            final introDy = (1 - _slide.value) * -64;
            // Sudrash bo'yicha qisman shaffoflik — UX feedback
            final dragOpacity = (1 + _dragDy / 160).clamp(0.0, 1.0);
            return Opacity(
              opacity: (_fade.value * dragOpacity).clamp(0.0, 1.0),
              child: Transform.translate(
                offset: Offset(0, introDy + _dragDy),
                child: child,
              ),
            );
          },
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onVerticalDragUpdate: _onDragUpdate,
            onVerticalDragEnd: _onDragEnd,
            child: ConstrainedBox(
              constraints:
                  BoxConstraints(maxWidth: isWide ? 460 : double.infinity),
              child: _ToastCard(
                palette: palette,
                message: widget.message,
                onClose: dismiss,
                totalMs: widget.autoDismissMs,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ToastCard extends StatelessWidget {
  final _ToastPalette palette;
  final String message;
  final VoidCallback onClose;
  // totalMs hozir ishlatilmaydi — oldingi progress bar animatsiyasi
  // render loop'ni bloklashga sabab bo'layotgan edi. Dizayn statik qoldi.
  // ignore: unused_element
  final int totalMs;

  const _ToastCard({
    required this.palette,
    required this.message,
    required this.onClose,
    required this.totalMs,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: BoxDecoration(
          color: palette.bg,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: palette.border, width: 1),
          boxShadow: [
            BoxShadow(
              color: palette.accent.withValues(alpha: 0.12),
              blurRadius: 28,
              offset: const Offset(0, 12),
              spreadRadius: -10,
            ),
            BoxShadow(
              color: const Color(0xFF0A0A0B).withValues(alpha: 0.45),
              blurRadius: 36,
              offset: const Offset(0, 18),
              spreadRadius: -14,
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Left accent bar — categorical signal
              Container(width: 3, color: palette.accent),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(14, 13, 10, 13),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Icon pill
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: palette.iconBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: palette.border, width: 1),
                        ),
                        child: Icon(palette.icon, size: 19, color: palette.accent),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              palette.title,
                              style: TextStyle(
                                fontSize: 12.5,
                                fontWeight: FontWeight.w600,
                                color: palette.accent,
                                fontFamily: 'Inter',
                                letterSpacing: -0.05,
                                height: 1.2,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              message,
                              maxLines: 4,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 13.5,
                                fontWeight: FontWeight.w400,
                                color: Color(0xFFE4E4E7),
                                fontFamily: 'Inter',
                                letterSpacing: -0.1,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      _ToastCloseButton(onTap: onClose),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ToastCloseButton extends StatefulWidget {
  final VoidCallback onTap;
  const _ToastCloseButton({required this.onTap});

  @override
  State<_ToastCloseButton> createState() => _ToastCloseButtonState();
}

class _ToastCloseButtonState extends State<_ToastCloseButton> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) {
        if (mounted) setState(() => _hover = true);
      },
      onExit: (_) {
        if (mounted) setState(() => _hover = false);
      },
      child: GestureDetector(
        onTap: widget.onTap,
        child: Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: _hover
                ? Colors.white.withValues(alpha: 0.08)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(
            Icons.close_rounded,
            size: 22,
            color: _hover
                ? const Color(0xFFF4F4F5)
                : const Color(0xFFA1A1AA),
          ),
        ),
      ),
    );
  }
}
