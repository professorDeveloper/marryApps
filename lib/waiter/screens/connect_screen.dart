import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';
import 'package:mary_ai_pos/core/services/lan/lan_discovery.dart';
import 'package:mary_ai_pos/core/services/lan/lan_rest_server.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';
import 'package:mary_ai_pos/waiter/screens/tables_screen.dart';
import 'package:mary_ai_pos/waiter/widgets/ember_kit.dart';

/// PIN uchun ko'rsatiladigan minimal katak soni. Ko'proq raqam kiritilsa
/// kataklar o'sadi — kassaning PIN uzunligini ilova cheklab qo'ymasligi kerak,
/// aks holda 6 xonali PIN'li ofitsiant umuman kira olmaydi.
const int _kPinSlots = 4;
const int _kPinMax = 8;

/// Kiritilgan manzilni to'liq baseUrl ga aylantiradi.
///
/// Toza funksiya — widget'siz sinash uchun. `null` = manzil yaroqsiz.
String? normalizePosUrl(String raw) {
  var url = raw.trim();
  if (url.isEmpty) return null;
  if (!url.startsWith('http')) url = 'http://$url';
  while (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  final uri = Uri.tryParse(url);
  if (uri == null || uri.host.isEmpty) return null;
  // Port ko'rsatilmagan bo'lsa standart LAN portini qo'shamiz.
  return uri.hasPort ? url : '$url:${LanRestServer.defaultPort}';
}

/// POS'ni topish va PIN bilan kirish.
///
/// Ikki bosqich: avval qurilma (discovery yoki qo'lda IP), keyin PIN.
/// Qo'lda kiritish ataylab qoldirilgan — mehmonxona/ofis routerlarida
/// broadcast bloklangan holatda yagona chora shu.
class ConnectScreen extends StatefulWidget {
  final LanApiClient api;

  const ConnectScreen({super.key, required this.api});

  @override
  State<ConnectScreen> createState() => _ConnectScreenState();
}

class _ConnectScreenState extends State<ConnectScreen> {
  final _brandController = TextEditingController();
  final _manualController = TextEditingController();

  List<DiscoveredPos> _found = const [];

  /// baseUrl → /health natijasi. Kalit bor, qiymat `null` — tekshirildi va
  /// yetib bo'lmadi; kalit yo'q — hali tekshirilmagan.
  final Map<String, _PosHealth?> _health = {};
  final Set<String> _probing = {};

  String? _selected;
  String? _lastKnown;

  String _pin = '';
  bool _pinVisible = false;
  bool _searching = false;
  bool _connecting = false;
  bool _manualMode = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _brandController.text = widget.api.brandId ?? '';

    // Oldingi seansdan qolgan manzil — discovery ishlamasa yagona ish
    // beradigan yo'l, shuning uchun darhol tanlangan holatda turadi.
    final saved = widget.api.baseUrl;
    if (saved != null && saved.isNotEmpty) {
      _lastKnown = saved;
      _selected = saved;
      _manualController.text = saved;
      _probe(saved);
    }
    _search();
  }

  @override
  void dispose() {
    _brandController.dispose();
    _manualController.dispose();
    super.dispose();
  }

  // ── Ma'lumot ──────────────────────────────────────────────────────────────

  Future<void> _search() async {
    setState(() {
      _searching = true;
      _error = null;
    });
    final found = await widget.api.discover();
    if (!mounted) return;

    // Bitta POS topilsa — darhol tanlaymiz, ortiqcha teginish shart emas.
    final auto = found.length == 1 ? found.first.baseUrl : null;
    setState(() {
      _found = found;
      _searching = false;
      if (found.isEmpty) _manualMode = true;
    });
    if (auto != null) await _select(auto);
    for (final pos in found) {
      _probe(pos.baseUrl);
    }
  }

  Future<void> _select(String url) async {
    await widget.api.setBaseUrl(url);
    if (!mounted) return;
    setState(() {
      _selected = url;
      // Qo'lda kiritish maydoni tanlovni ko'zguday takrorlaydi — `_connect`
      // manual rejimda aynan shu maydonni o'qiydi.
      _manualController.text = url;
      _error = null;
    });
    _probe(url);
  }

  /// `/health` — auth talab qilmaydi, shuning uchun PIN'gacha ham chaqirsa
  /// bo'ladi. Bu yerda `LanApiClient` ishlatilmaydi: u faqat tanlangan bitta
  /// manzilni biladi, bizga esa ro'yxatdagi har birining holati kerak.
  Future<void> _probe(String url) async {
    if (_probing.contains(url)) return;
    setState(() => _probing.add(url));
    final health = await _fetchHealth(url);
    if (!mounted) return;
    setState(() {
      _probing.remove(url);
      _health[url] = health;
    });
  }

  Future<void> _checkManual() async {
    final url = normalizePosUrl(_manualController.text);
    if (url == null) {
      setState(() => _error = 'POS manzilini kiriting');
      return;
    }
    await _select(url);
  }

  // ── Kirish ────────────────────────────────────────────────────────────────

  Future<void> _connect() async {
    final brand = _brandController.text.trim();
    final pin = _pin;

    if (_manualMode) {
      final url = normalizePosUrl(_manualController.text);
      if (url == null) {
        setState(() => _error = 'POS manzilini kiriting');
        return;
      }
      await widget.api.setBaseUrl(url);
      if (!mounted) return;
      setState(() => _selected = url);
    }

    if (!widget.api.isConfigured) {
      setState(() => _error = 'Avval POS ni tanlang');
      return;
    }
    if (brand.isEmpty || pin.isEmpty) {
      setState(() => _error = 'Brand ID va PIN kodni kiriting');
      return;
    }

    setState(() {
      _connecting = true;
      _error = null;
    });

    final result = await widget.api.loginPin(brandId: brand, pincode: pin);
    if (!mounted) return;

    if (!result.ok) {
      setState(() {
        _connecting = false;
        _error = result.error;
        // Noto'g'ri PIN'ni o'chiramiz — kataklar bo'shab, qayta terish
        // uchun tayyor turadi.
        _pin = '';
      });
      return;
    }

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => TablesScreen(api: widget.api)),
    );
  }

  void _pressDigit(String d) {
    if (_pin.length >= _kPinMax) return;
    HapticFeedback.selectionClick();
    setState(() {
      _pin += d;
      _error = null;
    });
  }

  void _backspace() {
    if (_pin.isEmpty) return;
    HapticFeedback.selectionClick();
    setState(() => _pin = _pin.substring(0, _pin.length - 1));
  }

  // ── Ko'rinish ─────────────────────────────────────────────────────────────

  /// Yuqoridagi lentaning o'ng burchagidagi holat.
  String get _stateLabel {
    if (_searching) return 'Qidirilmoqda';
    final url = _selected;
    if (url == null) return 'Ulanmagan';
    if (_probing.contains(url)) return 'Tekshirilmoqda';
    if (!_health.containsKey(url)) return 'Tanlandi';
    return _health[url] == null ? 'Aloqa yo\'q' : 'Tayyor';
  }

  @override
  Widget build(BuildContext context) {
    final queued = widget.api.queuedCount;

    return EmberScaffold(
      title: 'Ofitsiant',
      showHeader: false,
      body: Column(
        children: [
          EmberMetaStrip(labels: ['Mary AI', 'Ofitsiant', _stateLabel]),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) => constraints.maxWidth >= 900
                  ? _wide(context)
                  : _narrow(context),
            ),
          ),
          SafeArea(
            top: false,
            child: EmberMetaStrip(
              labels: [
                'LAN ${LanRestServer.defaultPort}',
                if (queued > 0) 'Navbatda $queued',
                '2026',
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _wide(BuildContext context) {
    final c = context.em;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(Ember.s24),
            children: [
              _brandBlock(context),
              const SizedBox(height: Ember.s24),
              _posPane(context),
            ],
          ),
        ),
        Container(width: Ember.hairlineWidth, color: c.hairline),
        SizedBox(
          width: 400,
          child: ListView(
            padding: const EdgeInsets.all(Ember.s24),
            children: [_authPane(context)],
          ),
        ),
      ],
    );
  }

  Widget _narrow(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Ember.s16),
      children: [
        _brandBlock(context),
        const SizedBox(height: Ember.s16),
        _posPane(context),
        const SizedBox(height: Ember.s24),
        _authPane(context),
      ],
    );
  }

  Widget _brandBlock(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            EmberMark.star8(size: 20, color: c.accent),
            const SizedBox(width: Ember.s12),
            Text('Mary AI POS'.toUpperCase(), style: t.labelAccent),
          ],
        ),
        const SizedBox(height: Ember.s16),
        Text('Ofitsiant', style: t.display1),
        const SizedBox(height: Ember.s8),
        Text('Kassa kompyuteriga ulaning', style: t.bodySm),
      ],
    );
  }

  // ── Kassa paneli ──────────────────────────────────────────────────────────

  Widget _posPane(BuildContext context) {
    final foundUrls = _found.map((e) => e.baseUrl).toSet();
    final last = _lastKnown;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        EmberSectionRule(
          label: 'Kassa',
          trailing: _searching
              ? const EmberSpinner(size: 16)
              : TextButton(
                  onPressed: _search,
                  child: const Text('Qayta qidirish'),
                ),
        ),

        if (last != null && !foundUrls.contains(last)) ...[
          _posRow(
            context,
            url: last,
            name: 'Oxirgi ulangan kassa',
            eyebrow: 'Oxirgi',
            note: widget.api.brandId == null || widget.api.brandId!.isEmpty
                ? null
                : 'Brand ${widget.api.brandId}',
          ),
          const SizedBox(height: Ember.s8),
        ],

        for (final pos in _found) ...[
          _posRow(
            context,
            url: pos.baseUrl,
            name: pos.name,
            note: pos.deviceId.isEmpty
                ? null
                : 'ID ${pos.deviceId.substring(0, math.min(8, pos.deviceId.length))}',
          ),
          const SizedBox(height: Ember.s8),
        ],

        if (_found.isEmpty)
          _searching ? _searchingBox(context) : _nothingFound(context),

        if (_manualMode) ...[
          const SizedBox(height: Ember.s8),
          _manualBlock(context),
        ],

        if (_found.isNotEmpty)
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton(
              onPressed: () => setState(() => _manualMode = !_manualMode),
              child: Text(
                _manualMode ? 'Ro\'yxatdan tanlash' : 'Qo\'lda kiritish',
              ),
            ),
          ),
      ],
    );
  }

  Widget _posRow(
    BuildContext context, {
    required String url,
    required String name,
    String? eyebrow,
    String? note,
  }) {
    final c = context.em;
    final t = context.emText;
    final selected = _selected == url;
    final probing = _probing.contains(url);
    final probed = _health.containsKey(url);
    final health = _health[url];
    final markColor = selected ? c.accent : c.inkDim;

    return EmberCard(
      selected: selected,
      onTap: () => _select(url),
      padding: const EdgeInsets.all(Ember.s12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: markColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(Ember.rSm),
            ),
            child: Center(child: EmberMark.globe(size: 20, color: markColor)),
          ),
          const SizedBox(width: Ember.s12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        name,
                        style: t.bodyLg,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (eyebrow != null) ...[
                      const SizedBox(width: Ember.s8),
                      Text(eyebrow.toUpperCase(), style: t.labelAccent),
                    ],
                  ],
                ),
                const SizedBox(height: Ember.s4),
                Text(
                  url.replaceFirst('http://', ''),
                  style: t.numeric(size: 13, color: c.inkDim),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (health != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          '${health.openOrders} TA OCHIQ · '
                          '${health.wsClients} TA ULANISH',
                          style: t.labelFaint,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (health.deadLetters > 0) ...[
                        const SizedBox(width: Ember.s8),
                        Text(
                          '${health.deadLetters} TA XATO',
                          style: t.label.copyWith(color: c.warn),
                        ),
                      ],
                    ],
                  ),
                ] else if (note != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    note.toUpperCase(),
                    style: t.labelFaint,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: Ember.s8),
          if (probing)
            const EmberSpinner(size: 16)
          else if (health != null)
            EmberChip(text: 'Tayyor', tone: EmberTone.ok, live: selected)
          else if (probed)
            const EmberChip(text: 'Aloqa yo\'q', tone: EmberTone.bad),
        ],
      ),
    );
  }

  Widget _searchingBox(BuildContext context) {
    final t = context.emText;
    return EmberCard(
      padding: const EdgeInsets.all(Ember.s16),
      child: Row(
        children: [
          const EmberSpinner(size: 18),
          const SizedBox(width: Ember.s12),
          Expanded(
            child: Text('Tarmoqda kassa qidirilmoqda', style: t.bodySm),
          ),
        ],
      ),
    );
  }

  Widget _nothingFound(BuildContext context) {
    return const EmberEmpty(
      mark: EmberMarkKind.arrowCircleDownLeft,
      tone: EmberTone.bad,
      eyebrow: 'Topilmadi',
      title: 'Kassa avtomatik topilmadi',
      message: 'Router broadcast paketlarni bloklagan bo\'lishi mumkin. '
          'Kassa ekranidagi manzilni quyida qo\'lda kiriting.',
    );
  }

  Widget _manualBlock(BuildContext context) {
    final t = context.emText;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const EmberSectionRule(label: 'Qo\'lda kiritish'),
        TextField(
          controller: _manualController,
          keyboardType: TextInputType.url,
          textInputAction: TextInputAction.done,
          style: t.numeric(size: 15),
          decoration: const InputDecoration(
            hintText: '192.168.1.50:${LanRestServer.defaultPort}',
          ),
          onSubmitted: (_) => _checkManual(),
        ),
        const SizedBox(height: Ember.s8),
        Row(
          children: [
            Expanded(
              child: Text(
                'Kassa ekranidagi manzil. Port yozilmasa '
                '${LanRestServer.defaultPort} qo\'shiladi.',
                style: t.bodyFaint,
              ),
            ),
            const SizedBox(width: Ember.s8),
            TextButton(
              onPressed: _checkManual,
              child: const Text('Tekshirish'),
            ),
          ],
        ),
      ],
    );
  }

  // ── Kirish paneli ─────────────────────────────────────────────────────────

  Widget _authPane(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final target = _selected;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const EmberSectionRule(label: 'Kirish'),

        Text('Brand ID'.toUpperCase(), style: t.label),
        const SizedBox(height: Ember.s8),
        TextField(
          controller: _brandController,
          textInputAction: TextInputAction.done,
          decoration: const InputDecoration(hintText: 'brand'),
          onChanged: (_) {
            if (_error != null) setState(() => _error = null);
          },
        ),
        const SizedBox(height: Ember.s16),

        Row(
          children: [
            Expanded(child: Text('PIN kod'.toUpperCase(), style: t.label)),
            IconButton(
              onPressed: () => setState(() => _pinVisible = !_pinVisible),
              icon: Icon(
                _pinVisible
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                size: 20,
                color: c.inkDim,
              ),
              tooltip: _pinVisible ? 'Yashirish' : 'Ko\'rsatish',
            ),
          ],
        ),
        const SizedBox(height: Ember.s4),
        _pinSlots(context),
        const SizedBox(height: Ember.s16),
        _keypad(context),

        if (_error != null) ...[
          const SizedBox(height: Ember.s16),
          EmberChip(
            text: _error!,
            tone: EmberTone.bad,
            icon: Icons.error_outline_rounded,
            expand: true,
            uppercase: false,
          ),
        ],

        const SizedBox(height: Ember.s24),
        EmberButton(
          label: 'Kirish',
          expand: true,
          loading: _connecting,
          onPressed: _connecting ? null : _connect,
        ),
        const SizedBox(height: Ember.s12),
        Text(
          target == null
              ? 'KASSA TANLANMAGAN'
              : 'KASSA · ${target.replaceFirst('http://', '')}',
          textAlign: TextAlign.center,
          style: t.labelFaint,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _pinSlots(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final slots = math.max(_kPinSlots, _pin.length);

    return Row(
      children: [
        for (var i = 0; i < slots; i++) ...[
          if (i > 0) const SizedBox(width: Ember.s8),
          Expanded(
            child: Container(
              height: 64,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: i < _pin.length ? c.raised : c.surface,
                borderRadius: BorderRadius.circular(Ember.rMd),
                border: Border.all(
                  color: i == _pin.length
                      ? c.accent
                      : (i < _pin.length ? c.hairlineHi : c.hairline),
                  width: i == _pin.length ? 1.5 : Ember.hairlineWidth,
                ),
              ),
              child: i < _pin.length
                  ? (_pinVisible
                      // Yopiq holatda nuqta belgisi emas, chizilgan doira —
                      // mono shriftda "●" glifi bo'lmasligi mumkin.
                      ? Text(_pin[i], style: t.numeric(size: 26))
                      : Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: c.ink,
                            shape: BoxShape.circle,
                          ),
                        ))
                  : null,
            ),
          ),
        ],
      ],
    );
  }

  /// Planshetda klaviatura yo'q — raqamlar faqat shu yerdan kiritiladi.
  Widget _keypad(BuildContext context) {
    return Column(
      children: [
        for (final row in const [
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ]) ...[
          Row(
            children: [
              for (final key in row) ...[
                if (key != row.first) const SizedBox(width: Ember.s8),
                Expanded(
                  child: _KeypadKey(
                    label: key,
                    onTap: () => _pressDigit(key),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: Ember.s8),
        ],
        Row(
          children: [
            Expanded(
              child: _KeypadKey(
                icon: Icons.clear_rounded,
                tooltip: 'Tozalash',
                onTap: _pin.isEmpty ? null : () => setState(() => _pin = ''),
              ),
            ),
            const SizedBox(width: Ember.s8),
            Expanded(child: _KeypadKey(label: '0', onTap: () => _pressDigit('0'))),
            const SizedBox(width: Ember.s8),
            Expanded(
              child: _KeypadKey(
                icon: Icons.backspace_outlined,
                tooltip: 'O\'chirish',
                onTap: _pin.isEmpty ? null : _backspace,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Raqamli klaviaturaning bitta tugmasi.
class _KeypadKey extends StatelessWidget {
  final String? label;
  final IconData? icon;
  final String? tooltip;
  final VoidCallback? onTap;

  const _KeypadKey({this.label, this.icon, this.tooltip, this.onTap});

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final enabled = onTap != null;

    final key = Material(
      color: c.raised,
      borderRadius: BorderRadius.circular(Ember.rMd),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(Ember.rMd),
        child: Container(
          height: Ember.control,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Ember.rMd),
            border: Border.all(color: c.hairlineHi),
          ),
          child: icon != null
              ? Icon(icon, size: 20, color: enabled ? c.ink : c.inkFaint)
              : Text(
                  label ?? '',
                  style: t.numeric(size: 22, color: enabled ? c.ink : c.inkFaint),
                ),
        ),
      ),
    );

    return tooltip == null ? key : Tooltip(message: tooltip!, child: key);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// /health probe
// ═══════════════════════════════════════════════════════════════════════════

/// `/health` javobining ofitsiantga kerakli qismi.
@immutable
class _PosHealth {
  final int wsClients;
  final int openOrders;
  final int deadLetters;

  const _PosHealth({
    required this.wsClients,
    required this.openOrders,
    required this.deadLetters,
  });
}

/// Bitta kassaning holatini so'raydi. Timeout qisqa: ro'yxatdagi barcha
/// manzillar parallel tekshiriladi va ulardan ba'zilari (virtual adapter
/// IP'lari) umuman javob bermaydi.
Future<_PosHealth?> _fetchHealth(String baseUrl) async {
  final uri = Uri.tryParse('$baseUrl/health');
  if (uri == null || uri.host.isEmpty) return null;

  final http = HttpClient()..connectionTimeout = const Duration(seconds: 2);
  try {
    final req = await http.getUrl(uri);
    final res = await req.close().timeout(const Duration(seconds: 3));
    final text = await utf8.decoder.bind(res).join();
    if (res.statusCode != 200) return null;
    final decoded = jsonDecode(text);
    if (decoded is! Map || decoded['ok'] != true) return null;
    int asCount(Object? v) => v is num ? v.toInt() : 0;
    return _PosHealth(
      wsClients: asCount(decoded['ws_clients']),
      openOrders: asCount(decoded['open_orders']),
      deadLetters: asCount(decoded['dead_letters']),
    );
  } catch (_) {
    return null;
  } finally {
    http.close(force: true);
  }
}
