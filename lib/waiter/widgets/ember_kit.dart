import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';

/// Ember dizayn sistemasining umumiy widget lug'ati.
///
/// Qoida: ekranlar bu yerdagi bloklardan yig'iladi. Yangi `Container` +
/// `BoxDecoration` yozishdan oldin shu faylda mos blok bor-yo'qligini
/// tekshiring — takrorlanish Slate Dawn'ni buzgan asosiy sabab edi.

/// Status ohanglari — chip, karta qirrasi, stat raqami uchun bir xil til.
enum EmberTone { neutral, accent, ok, warn, bad }

/// Ohang → rang. Widget'lar ichida ham, ekranlarda ham ishlatiladi.
Color emberToneColor(EmberColors c, EmberTone tone) => switch (tone) {
      EmberTone.neutral => c.inkDim,
      EmberTone.accent => c.accent,
      EmberTone.ok => c.ok,
      EmberTone.warn => c.warn,
      EmberTone.bad => c.bad,
    };

// ═══════════════════════════════════════════════════════════════════════════
// EmberScaffold
// ═══════════════════════════════════════════════════════════════════════════

/// Sahifa qobig'i. Eng kuchli motiv — yuqoridagi **metama'lumot lentasi**:
/// hairline bilan ajratilgan UPPERCASE mono mikro-yozuvlar qatori.
class EmberScaffold extends StatelessWidget {
  final String title;
  final String? subtitle;

  /// Yuqoridagi lentaga chiqadigan mikro-yozuvlar (maksimum 3 tasi olinadi).
  /// Bittadan ko'p bo'lsa oxirgisi o'ng burchakka suriladi — referens
  /// bordlaridagidek.
  final List<String> meta;

  /// Sarlavha qatorining o'ng tomoni.
  final List<Widget> actions;

  final Widget body;
  final Widget? bottomBar;
  final Widget? floatingActionButton;

  /// `null` bo'lsa va Navigator ortga qayta olsa — orqaga tugmasi chiqadi.
  final Widget? leading;
  final bool showBack;

  /// Sarlavha va lentani butunlay yashiradi (masalan login ekrani uchun).
  final bool showHeader;

  const EmberScaffold({
    super.key,
    required this.title,
    required this.body,
    this.subtitle,
    this.meta = const [],
    this.actions = const [],
    this.bottomBar,
    this.floatingActionButton,
    this.leading,
    this.showBack = true,
    this.showHeader = true,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;

    return Scaffold(
      backgroundColor: c.surface,
      bottomNavigationBar: bottomBar,
      floatingActionButton: floatingActionButton,
      body: Column(
        children: [
          if (showHeader)
            Container(
              color: c.canvas,
              child: SafeArea(
                bottom: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    EmberMetaStrip(labels: meta),
                    SizedBox(
                      height: Ember.header,
                      child: Row(
                        children: [
                          if (leading != null)
                            leading!
                          else if (showBack &&
                              (Navigator.maybeOf(context)?.canPop() ?? false))
                            _HeaderBack(color: c.ink)
                          else
                            const SizedBox(width: Ember.s16),
                          Expanded(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  title,
                                  style: t.display3,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                if (subtitle != null)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 2),
                                    child: Text(
                                      subtitle!,
                                      style: t.bodySm,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                          if (actions.isNotEmpty) ...[
                            const SizedBox(width: Ember.s12),
                            ...actions,
                            const SizedBox(width: Ember.s16),
                          ] else
                            const SizedBox(width: Ember.s16),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          if (showHeader) const EmberHairline(),
          Expanded(
            child: showHeader ? body : SafeArea(bottom: false, child: body),
          ),
        ],
      ),
    );
  }
}

/// Yuqoridagi mono mikro-yozuvlar lentasi. `EmberScaffold` ichida avtomatik,
/// lekin alohida ham ishlatsa bo'ladi (masalan sheet ustida).
class EmberMetaStrip extends StatelessWidget {
  final List<String> labels;

  const EmberMetaStrip({super.key, required this.labels});

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final items = labels.where((e) => e.trim().isNotEmpty).take(3).toList();
    if (items.isEmpty) return const SizedBox.shrink();

    // Bittadan ko'p bo'lsa oxirgisi o'ng burchakka — brend bordlaridagidek.
    final left = items.length > 1 ? items.sublist(0, items.length - 1) : items;
    final right = items.length > 1 ? items.last : null;

    final children = <Widget>[];
    for (var i = 0; i < left.length; i++) {
      if (i > 0) children.add(_rule(c));
      children.add(
        Flexible(
          child: Text(
            left[i].toUpperCase(),
            style: t.labelFaint,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      );
    }
    if (right != null) {
      children.add(const Spacer());
      children.add(_rule(c));
      children.add(
        Text(
          right.toUpperCase(),
          style: t.labelFaint,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      );
    }

    return Container(
      height: Ember.metaStrip,
      padding: const EdgeInsets.symmetric(horizontal: Ember.s16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: c.hairline)),
      ),
      child: Row(children: children),
    );
  }

  Widget _rule(EmberColors c) => Container(
        width: Ember.hairlineWidth,
        height: 12,
        color: c.hairline,
        margin: const EdgeInsets.symmetric(horizontal: Ember.s12),
      );
}

class _HeaderBack extends StatelessWidget {
  final Color color;

  const _HeaderBack({required this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: Ember.header,
      height: Ember.header,
      child: IconButton(
        onPressed: () => Navigator.of(context).maybePop(),
        icon: Icon(Icons.arrow_back_rounded, color: color, size: 22),
        tooltip: 'Orqaga',
      ),
    );
  }
}

/// 1px ajratuvchi chiziq. Ember soyaga emas, shu chiziqqa tayanadi.
class EmberHairline extends StatelessWidget {
  final bool strong;
  final double indent;
  final double endIndent;

  const EmberHairline({
    super.key,
    this.strong = false,
    this.indent = 0,
    this.endIndent = 0,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    return Container(
      height: Ember.hairlineWidth,
      margin: EdgeInsets.only(left: indent, right: endIndent),
      color: strong ? c.hairlineHi : c.hairline,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberSectionRule
// ═══════════════════════════════════════════════════════════════════════════

/// Yozuvli ajratgich: UPPERCASE mono label + cheksiz hairline.
class EmberSectionRule extends StatelessWidget {
  final String label;

  /// O'ng chetdagi qo'shimcha (masalan "Qayta qidirish" tugmasi).
  final Widget? trailing;
  final EmberTone tone;
  final EdgeInsetsGeometry padding;

  const EmberSectionRule({
    super.key,
    required this.label,
    this.trailing,
    this.tone = EmberTone.neutral,
    this.padding = const EdgeInsets.symmetric(vertical: Ember.s12),
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final color = tone == EmberTone.neutral
        ? c.inkDim
        : emberToneColor(c, tone);

    return Padding(
      padding: padding,
      child: Row(
        children: [
          Text(label.toUpperCase(), style: t.label.copyWith(color: color)),
          const SizedBox(width: Ember.s12),
          Expanded(child: Container(height: 1, color: c.hairline)),
          if (trailing != null) ...[
            const SizedBox(width: Ember.s12),
            trailing!,
          ],
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberChip
// ═══════════════════════════════════════════════════════════════════════════

/// Status pili. Standart ko'rinish — yumshoq (rang 12% fon + 30% chegara);
/// `solid: true` faqat tanlangan filtr uchun.
class EmberChip extends StatelessWidget {
  final String text;
  final EmberTone tone;
  final IconData? icon;

  /// Chapda pulsatsiyalanuvchi nuqta — "jonli" holat uchun.
  final bool live;

  /// To'liq kenglikni egallaydi (xato qutisi sifatida).
  final bool expand;

  /// To'ldirilgan variant. Uzun matnlar uchun ishlatmang.
  final bool solid;

  /// Matnni UPPERCASE ga aylantiradi. Uzun jumlalar uchun `false`.
  final bool uppercase;

  final VoidCallback? onTap;

  const EmberChip({
    super.key,
    required this.text,
    this.tone = EmberTone.neutral,
    this.icon,
    this.live = false,
    this.expand = false,
    this.solid = false,
    this.uppercase = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final color = emberToneColor(c, tone);
    final fg = solid
        ? (tone == EmberTone.accent ? c.onAccent : c.canvas)
        : color;

    final chip = Container(
      constraints: const BoxConstraints(minHeight: 30),
      padding: const EdgeInsets.symmetric(
        horizontal: Ember.s12,
        vertical: 7,
      ),
      decoration: BoxDecoration(
        color: solid ? color : color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(Ember.rSm),
        border: Border.all(
          color: solid ? color : color.withValues(alpha: 0.30),
        ),
      ),
      child: Row(
        mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
        children: [
          if (live) ...[
            _PulseDot(color: fg),
            const SizedBox(width: Ember.s8),
          ],
          if (icon != null) ...[
            Icon(icon, size: 15, color: fg),
            const SizedBox(width: Ember.s8),
          ],
          Flexible(
            child: Text(
              uppercase ? text.toUpperCase() : text,
              style: uppercase
                  ? t.label.copyWith(color: fg)
                  : t.bodySm.copyWith(color: fg, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );

    final sized = expand ? SizedBox(width: double.infinity, child: chip) : chip;
    if (onTap == null) return sized;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Ember.rSm),
      child: sized,
    );
  }
}

class _PulseDot extends StatefulWidget {
  final Color color;

  const _PulseDot({required this.color});

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl = AnimationController(
    vsync: this,
    duration: Ember.pulse,
  )..repeat(reverse: true);

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, _) {
        final v = Curves.easeInOut.transform(_ctrl.value);
        return SizedBox(
          width: 8,
          height: 8,
          child: Center(
            child: Container(
              width: 6 + v * 2,
              height: 6 + v * 2,
              decoration: BoxDecoration(
                color: widget.color.withValues(alpha: 0.55 + v * 0.45),
                shape: BoxShape.circle,
              ),
            ),
          ),
        );
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberCard
// ═══════════════════════════════════════════════════════════════════════════

/// Ko'tarilgan yuza + hairline chegara. Ixtiyoriy chap accent qirrasi.
class EmberCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;

  /// Chap chetdagi 3px rangli qirra. `null` — qirra yo'q.
  final EmberTone? edge;

  /// Tanlangan holat: chegara accent'ga aylanadi.
  final bool selected;

  final EdgeInsetsGeometry padding;
  final double radius;
  final Color? background;
  final Color? borderColor;

  const EmberCard({
    super.key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.edge,
    this.selected = false,
    this.padding = const EdgeInsets.all(Ember.s16),
    this.radius = Ember.rMd,
    this.background,
    this.borderColor,
  });

  @override
  State<EmberCard> createState() => _EmberCardState();
}

class _EmberCardState extends State<EmberCard> {
  bool _pressed = false;

  void _set(bool v) {
    if (_pressed != v && mounted) setState(() => _pressed = v);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final tappable = widget.onTap != null || widget.onLongPress != null;
    final border = widget.borderColor ??
        (widget.selected ? c.accent : (_pressed ? c.hairlineHi : c.hairline));
    final bg = widget.background ?? (_pressed ? c.overlay : c.raised);

    final content = AnimatedContainer(
      duration: Ember.fast,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(widget.radius),
        border: Border.all(
          color: border,
          width: widget.selected ? 1.5 : Ember.hairlineWidth,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(widget.radius),
        child: Stack(
          children: [
            Padding(
              padding: widget.edge != null
                  ? widget.padding.add(const EdgeInsets.only(left: Ember.s4))
                  : widget.padding,
              child: widget.child,
            ),
            if (widget.edge != null)
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Container(
                  width: 3,
                  color: emberToneColor(c, widget.edge!),
                ),
              ),
          ],
        ),
      ),
    );

    if (!tappable) return content;

    return GestureDetector(
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      behavior: HitTestBehavior.opaque,
      child: content,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberStat
// ═══════════════════════════════════════════════════════════════════════════

/// Katta mono raqam + ostida kichik UPPERCASE yozuv. Summary lentalari uchun.
class EmberStat extends StatelessWidget {
  final String value;
  final String label;
  final EmberTone tone;
  final double valueSize;
  final CrossAxisAlignment align;

  /// Raqamdan keyingi kichik qo'shimcha ("so'm", "ta").
  final String? unit;

  const EmberStat({
    super.key,
    required this.value,
    required this.label,
    this.tone = EmberTone.neutral,
    this.valueSize = 24,
    this.align = CrossAxisAlignment.start,
    this.unit,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final color = tone == EmberTone.neutral ? c.ink : emberToneColor(c, tone);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: align,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              value,
              style: t.numeric(size: valueSize, color: color),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            if (unit != null) ...[
              const SizedBox(width: Ember.s4),
              Text(unit!.toUpperCase(), style: t.labelFaint),
            ],
          ],
        ),
        const SizedBox(height: Ember.s8),
        Text(
          label.toUpperCase(),
          style: t.labelFaint,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberButton
// ═══════════════════════════════════════════════════════════════════════════

enum EmberButtonKind { primary, ghost, danger }

/// 52px balandlikdagi tugma. `loading` paytida bosilmaydi va matn o'rniga
/// spinner ko'rsatiladi (o'lcham sakramasligi uchun kenglik saqlanadi).
class EmberButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final EmberButtonKind kind;
  final IconData? icon;
  final bool loading;
  final bool expand;
  final double height;

  const EmberButton({
    super.key,
    required this.label,
    this.onPressed,
    this.kind = EmberButtonKind.primary,
    this.icon,
    this.loading = false,
    this.expand = false,
    this.height = Ember.control,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;

    final (Color bg, Color fg, Color? side) = switch (kind) {
      EmberButtonKind.primary => (c.accent, c.onAccent, null),
      EmberButtonKind.ghost => (Colors.transparent, c.ink, c.hairlineHi),
      EmberButtonKind.danger => (c.bad, c.onAccent, null),
    };

    final enabled = onPressed != null && !loading;

    final child = loading
        ? EmberSpinner(size: 20, color: fg)
        : Row(
            mainAxisSize: expand ? MainAxisSize.max : MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 19, color: fg),
                const SizedBox(width: Ember.s8),
              ],
              Flexible(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: t.bodyLg.copyWith(
                    color: fg,
                    fontWeight: FontWeight.w700,
                    letterSpacing: -0.16,
                  ),
                ),
              ),
            ],
          );

    final button = Opacity(
      opacity: enabled ? 1 : 0.45,
      child: Material(
        color: kind == EmberButtonKind.ghost ? Colors.transparent : bg,
        borderRadius: BorderRadius.circular(Ember.rMd),
        child: InkWell(
          onTap: enabled ? onPressed : null,
          borderRadius: BorderRadius.circular(Ember.rMd),
          splashColor: fg.withValues(alpha: 0.10),
          highlightColor: fg.withValues(alpha: 0.06),
          child: Container(
            height: height,
            padding: const EdgeInsets.symmetric(horizontal: Ember.s24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Ember.rMd),
              border: side == null ? null : Border.all(color: side),
            ),
            child: Center(child: child),
          ),
        ),
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}

/// Tugma va yuklanish holatlari uchun yagona spinner.
class EmberSpinner extends StatelessWidget {
  final double size;
  final Color? color;

  const EmberSpinner({super.key, this.size = 20, this.color});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        color: color ?? context.em.accent,
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberStepper
// ═══════════════════════════════════════════════════════════════════════════

/// − raqam + . Har bir tugma 44px teginish maydoni.
class EmberStepper extends StatelessWidget {
  final int value;
  final VoidCallback? onMinus;
  final VoidCallback? onPlus;

  /// `value` shu qiymatga yetganda minus o'chadi.
  final int min;
  final int? max;
  final double size;

  const EmberStepper({
    super.key,
    required this.value,
    this.onMinus,
    this.onPlus,
    this.min = 0,
    this.max,
    this.size = Ember.hit,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final canMinus = onMinus != null && value > min;
    final canPlus = onPlus != null && (max == null || value < max!);

    return Container(
      height: size,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(Ember.rSm),
        border: Border.all(color: c.hairlineHi),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove_rounded,
            size: size,
            enabled: canMinus,
            onTap: onMinus,
          ),
          Container(width: Ember.hairlineWidth, height: size, color: c.hairline),
          ConstrainedBox(
            constraints: BoxConstraints(minWidth: size * 0.9),
            child: Center(
              child: Text(
                '$value',
                style: t.numeric(size: 17),
              ),
            ),
          ),
          Container(width: Ember.hairlineWidth, height: size, color: c.hairline),
          _StepButton(
            icon: Icons.add_rounded,
            size: size,
            enabled: canPlus,
            onTap: onPlus,
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  final IconData icon;
  final double size;
  final bool enabled;
  final VoidCallback? onTap;

  const _StepButton({
    required this.icon,
    required this.size,
    required this.enabled,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(Ember.rSm),
      child: SizedBox(
        width: size,
        height: size,
        child: Icon(
          icon,
          size: 20,
          color: enabled ? c.ink : c.inkFaint,
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberEmpty
// ═══════════════════════════════════════════════════════════════════════════

/// Bo'sh yoki xato holati: texnik belgi + o'zbekcha izoh + ixtiyoriy amal.
class EmberEmpty extends StatelessWidget {
  final String title;
  final String? message;
  final EmberMarkKind mark;
  final EmberTone tone;
  final String? actionLabel;
  final VoidCallback? onAction;

  /// Yuqoridagi kichik mono yozuv (masalan "KESH BO'SH").
  final String? eyebrow;

  const EmberEmpty({
    super.key,
    required this.title,
    this.message,
    this.mark = EmberMarkKind.star8,
    this.tone = EmberTone.neutral,
    this.actionLabel,
    this.onAction,
    this.eyebrow,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final color = tone == EmberTone.neutral
        ? c.inkFaint
        : emberToneColor(c, tone);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Ember.s32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            EmberMark(kind: mark, size: 40, color: color),
            const SizedBox(height: Ember.s24),
            if (eyebrow != null) ...[
              Text(eyebrow!.toUpperCase(), style: t.label.copyWith(color: color)),
              const SizedBox(height: Ember.s8),
            ],
            Text(
              title,
              textAlign: TextAlign.center,
              style: t.display3.copyWith(fontSize: 19),
            ),
            if (message != null) ...[
              const SizedBox(height: Ember.s8),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 320),
                child: Text(
                  message!,
                  textAlign: TextAlign.center,
                  style: t.bodySm,
                ),
              ),
            ],
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: Ember.s24),
              EmberButton(
                label: actionLabel!,
                kind: EmberButtonKind.ghost,
                onPressed: onAction,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberMark — CustomPainter bilan chizilgan texnik belgilar
// ═══════════════════════════════════════════════════════════════════════════

enum EmberMarkKind { star8, globeWire, arrowCircleDownLeft }

/// Brend bordlaridagi texnik glyflar. Asset yo'q, sof vektor.
/// Ular **aksent**, illyustratsiya emas — kichik va aniq saqlang.
class EmberMark extends StatelessWidget {
  final EmberMarkKind kind;
  final double size;
  final Color? color;
  final double strokeWidth;

  const EmberMark({
    super.key,
    required this.kind,
    this.size = 20,
    this.color,
    this.strokeWidth = 1.2,
  });

  const EmberMark.star8({
    super.key,
    this.size = 20,
    this.color,
    this.strokeWidth = 1.2,
  }) : kind = EmberMarkKind.star8;

  const EmberMark.globe({
    super.key,
    this.size = 20,
    this.color,
    this.strokeWidth = 1.2,
  }) : kind = EmberMarkKind.globeWire;

  const EmberMark.arrow({
    super.key,
    this.size = 20,
    this.color,
    this.strokeWidth = 1.2,
  }) : kind = EmberMarkKind.arrowCircleDownLeft;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _MarkPainter(
          kind: kind,
          color: color ?? context.em.accent,
          strokeWidth: strokeWidth,
        ),
      ),
    );
  }
}

class _MarkPainter extends CustomPainter {
  final EmberMarkKind kind;
  final Color color;
  final double strokeWidth;

  const _MarkPainter({
    required this.kind,
    required this.color,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final r = math.min(size.width, size.height) / 2 - strokeWidth;

    switch (kind) {
      case EmberMarkKind.star8:
        _star8(canvas, center, r);
      case EmberMarkKind.globeWire:
        _globe(canvas, center, r);
      case EmberMarkKind.arrowCircleDownLeft:
        _arrow(canvas, center, r);
    }
  }

  Paint get _stroke => Paint()
    ..color = color
    ..style = PaintingStyle.stroke
    ..strokeWidth = strokeWidth
    ..strokeCap = StrokeCap.square
    ..isAntiAlias = true;

  // 8 nurli yulduz — to'ldirilgan, ichki radius 0.36.
  void _star8(Canvas canvas, Offset c, double r) {
    final path = Path();
    for (var i = 0; i < 16; i++) {
      final rad = i.isEven ? r : r * 0.36;
      final a = -math.pi / 2 + i * math.pi / 8;
      final p = Offset(c.dx + rad * math.cos(a), c.dy + rad * math.sin(a));
      i == 0 ? path.moveTo(p.dx, p.dy) : path.lineTo(p.dx, p.dy);
    }
    path.close();
    canvas.drawPath(
      path,
      Paint()
        ..color = color
        ..style = PaintingStyle.fill
        ..isAntiAlias = true,
    );
  }

  // Simli globus: doira + meridianlar + parallellar.
  void _globe(Canvas canvas, Offset c, double r) {
    final p = _stroke;
    canvas.drawCircle(c, r, p);
    canvas.drawOval(
      Rect.fromCenter(center: c, width: r * 0.9, height: r * 2),
      p,
    );
    canvas.drawLine(Offset(c.dx, c.dy - r), Offset(c.dx, c.dy + r), p);
    canvas.drawLine(Offset(c.dx - r, c.dy), Offset(c.dx + r, c.dy), p);
    for (final dy in [-r * 0.55, r * 0.55]) {
      final half = math.sqrt(math.max(0, r * r - dy * dy));
      canvas.drawLine(
        Offset(c.dx - half, c.dy + dy),
        Offset(c.dx + half, c.dy + dy),
        p,
      );
    }
  }

  // Doira ichida chap-pastga qaragan strelka.
  void _arrow(Canvas canvas, Offset c, double r) {
    final p = _stroke;
    canvas.drawCircle(c, r, p);
    final tail = Offset(c.dx + r * 0.42, c.dy - r * 0.42);
    final tip = Offset(c.dx - r * 0.42, c.dy + r * 0.42);
    canvas.drawLine(tail, tip, p);
    canvas.drawLine(tip, Offset(tip.dx + r * 0.55, tip.dy), p);
    canvas.drawLine(tip, Offset(tip.dx, tip.dy - r * 0.55), p);
  }

  @override
  bool shouldRepaint(_MarkPainter old) =>
      old.kind != kind || old.color != color || old.strokeWidth != strokeWidth;
}

// ═══════════════════════════════════════════════════════════════════════════
// EmberFilterStrip
// ═══════════════════════════════════════════════════════════════════════════

/// Filtr lentasining bitta elementi.
@immutable
class EmberFilterItem {
  /// `null` — "Barchasi".
  final String? id;
  final String label;

  /// O'ngdagi ixtiyoriy raqam (masalan stollar soni).
  final int? count;

  const EmberFilterItem({required this.id, required this.label, this.count});
}

/// Gorizontal filtr lentasi (zallar, kategoriyalar). Ilgari bu 46 qator kod
/// ikkita ekranda so'zma-so'z takrorlangan edi.
class EmberFilterStrip extends StatelessWidget {
  final List<EmberFilterItem> items;
  final String? selectedId;
  final ValueChanged<String?> onSelected;

  /// Boshiga "Barchasi" elementini qo'shadi (`id: null`).
  final bool showAll;
  final String allLabel;

  const EmberFilterStrip({
    super.key,
    required this.items,
    required this.selectedId,
    required this.onSelected,
    this.showAll = true,
    this.allLabel = 'Barchasi',
  });

  @override
  Widget build(BuildContext context) {
    final all = <EmberFilterItem>[
      if (showAll) EmberFilterItem(id: null, label: allLabel),
      ...items,
    ];

    return SizedBox(
      height: Ember.control + Ember.s16,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(
          Ember.s16,
          Ember.s8,
          Ember.s16,
          Ember.s8,
        ),
        itemCount: all.length,
        separatorBuilder: (_, _) => const SizedBox(width: Ember.s8),
        itemBuilder: (_, i) {
          final item = all[i];
          return _FilterTab(
            item: item,
            selected: item.id == selectedId,
            onTap: () => onSelected(item.id),
          );
        },
      ),
    );
  }
}

class _FilterTab extends StatelessWidget {
  final EmberFilterItem item;
  final bool selected;
  final VoidCallback onTap;

  const _FilterTab({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(Ember.rSm),
      child: AnimatedContainer(
        duration: Ember.fast,
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(horizontal: Ember.s16),
        decoration: BoxDecoration(
          color: selected ? c.accent : Colors.transparent,
          borderRadius: BorderRadius.circular(Ember.rSm),
          border: Border.all(color: selected ? c.accent : c.hairlineHi),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              item.label,
              style: t.body.copyWith(
                color: selected ? c.onAccent : c.ink,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
            if (item.count != null) ...[
              const SizedBox(width: Ember.s8),
              Text(
                '${item.count}',
                style: t.numeric(
                  size: 13,
                  color: selected
                      ? c.onAccent.withValues(alpha: 0.75)
                      : c.inkFaint,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
