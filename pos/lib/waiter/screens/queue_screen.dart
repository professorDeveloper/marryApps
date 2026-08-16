import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/waiter/widgets/ember_kit.dart';

/// Navbat — ilovaning "offline vijdoni".
///
/// Ikki ro'yxat qat'iy ajratilgan: **kutilmoqda** (POS'ga yetib bormagan,
/// o'zi yuboriladi) va **yuborilmadi** (POS rad etgan). Ikkinchisida
/// o'chirish tugmasi ataylab yo'q — ofitsiant yo'qolgan buyurtmani
/// ekrandan olib tashlay olsa, u haqda hech kim bilmay qoladi.
class QueueScreen extends StatefulWidget {
  final LanApiClient api;

  const QueueScreen({super.key, required this.api});

  @override
  State<QueueScreen> createState() => _QueueScreenState();
}

class _QueueScreenState extends State<QueueScreen> {
  List<Map<String, dynamic>> _pending = const [];
  List<Map<String, dynamic>> _failed = const [];

  /// table_id → stol raqami. Navbatda faqat uuid saqlanadi, ofitsiantga esa
  /// raqam kerak.
  Map<String, String> _tableNumbers = const {};

  bool _loading = true;
  bool _flushing = false;
  Timer? _tick;
  StreamSubscription<bool>? _conn;

  @override
  void initState() {
    super.initState();
    _load();
    // Navbat fonda ham bo'shaydi (waiter_app har 10 soniyada flush qiladi),
    // shuning uchun ekran o'zini muntazam yangilab turadi.
    _tick = Timer.periodic(const Duration(seconds: 3), (_) => _readQueue());
    _conn = widget.api.onConnectionChanged.listen((_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tick?.cancel();
    _conn?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    _readQueue();
    final tables = await widget.api.getTables();
    if (!mounted) return;
    setState(() {
      _tableNumbers = {
        for (final t in tables)
          if (t['id'] != null) '${t['id']}': '${asNum(t['number'], 0).toInt()}',
      };
      _loading = false;
    });
  }

  void _readQueue() {
    if (!mounted) return;
    setState(() {
      _pending = widget.api.pendingOperations;
      _failed = widget.api.failedOperations;
    });
  }

  Future<void> _flushNow() async {
    if (_flushing) return;
    setState(() => _flushing = true);
    await widget.api.ping();
    await widget.api.flushQueue();
    if (!mounted) return;
    setState(() => _flushing = false);
    _readQueue();
  }

  @override
  Widget build(BuildContext context) {
    final reachable = widget.api.isReachable;

    return EmberScaffold(
      title: 'Navbat',
      subtitle: 'Kassaga yetkazilmagan amallar',
      meta: [
        'MARY AI',
        'NAVBAT',
        reachable ? 'ULANGAN' : 'ALOQA YO\'Q',
      ],
      actions: [
        EmberChip(
          text: reachable ? 'Ulangan' : 'Aloqa yo\'q',
          tone: reachable ? EmberTone.ok : EmberTone.bad,
          live: reachable,
        ),
      ],
      bottomBar: _bottomBar(context, reachable),
      body: _body(context, reachable),
    );
  }

  Widget _body(BuildContext context, bool reachable) {
    if (_loading) {
      return const Center(child: EmberSpinner(size: 26));
    }

    if (_pending.isEmpty && _failed.isEmpty) {
      return EmberEmpty(
        eyebrow: 'Navbat',
        title: 'Navbat bo\'sh',
        message: reachable
            ? 'Hamma buyurtma kassaga yetkazilgan.'
            : 'Yetkazilmagan amal yo\'q. Aloqa tiklanganda ham yuboradigan '
                'narsa qolmaydi.',
        actionLabel: 'Yangilash',
        onAction: _load,
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: context.em.accent,
      backgroundColor: context.em.raised,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(
          Ember.s16,
          Ember.s8,
          Ember.s16,
          Ember.s24,
        ),
        children: [
          _summary(context),
          if (_pending.isNotEmpty) ...[
            const EmberSectionRule(
              label: 'Kutilmoqda',
              tone: EmberTone.warn,
              padding: EdgeInsets.only(top: Ember.s24, bottom: Ember.s12),
            ),
            _pendingHint(context, reachable),
            for (final op in _pending)
              Padding(
                padding: const EdgeInsets.only(bottom: Ember.s8),
                child: _PendingCard(op: op, tableNumbers: _tableNumbers),
              ),
          ],
          if (_failed.isNotEmpty) ...[
            const EmberSectionRule(
              label: 'Yuborilmadi',
              tone: EmberTone.bad,
              padding: EdgeInsets.only(top: Ember.s24, bottom: Ember.s12),
            ),
            _failedHint(context),
            for (final op in _failed)
              Padding(
                padding: const EdgeInsets.only(bottom: Ember.s8),
                child: _FailedCard(op: op, tableNumbers: _tableNumbers),
              ),
          ],
        ],
      ),
    );
  }

  Widget _summary(BuildContext context) {
    final c = context.em;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: Ember.s16),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: c.hairline)),
      ),
      child: Row(
        children: [
          Expanded(
            child: EmberStat(
              value: '${_pending.length}',
              label: 'Kutilmoqda',
              unit: 'ta',
              tone: _pending.isEmpty ? EmberTone.neutral : EmberTone.warn,
            ),
          ),
          Container(width: Ember.hairlineWidth, height: 40, color: c.hairline),
          const SizedBox(width: Ember.s16),
          Expanded(
            child: EmberStat(
              value: '${_failed.length}',
              label: 'Yuborilmadi',
              unit: 'ta',
              tone: _failed.isEmpty ? EmberTone.neutral : EmberTone.bad,
            ),
          ),
          Container(width: Ember.hairlineWidth, height: 40, color: c.hairline),
          const SizedBox(width: Ember.s16),
          Expanded(
            child: EmberStat(
              value: Ember.money(_queuedTotal),
              label: 'Navbatdagi summa',
              valueSize: 20,
            ),
          ),
        ],
      ),
    );
  }

  num get _queuedTotal =>
      _pending.fold<num>(0, (s, op) => s + _opTotal(op)) +
      _failed.fold<num>(0, (s, op) => s + _opTotal(op));

  Widget _pendingHint(BuildContext context, bool reachable) {
    final t = context.emText;
    return Padding(
      padding: const EdgeInsets.only(bottom: Ember.s12),
      child: Text(
        reachable
            ? 'Kassa topildi — bular hozir yuboriladi.'
            : 'Kassa bilan aloqa tiklanishi bilan avtomatik yuboriladi. '
                'Ilovani yopsangiz ham yo\'qolmaydi.',
        style: t.bodySm,
      ),
    );
  }

  Widget _failedHint(BuildContext context) {
    final t = context.emText;
    return Padding(
      padding: const EdgeInsets.only(bottom: Ember.s12),
      child: Text(
        'Kassa bu amallarni qabul qilmadi. Qayta urinish yordam bermaydi — '
        'kassirga aytib, buyurtmani qo\'lda kiritish kerak.',
        style: t.bodySm.copyWith(color: context.em.bad),
      ),
    );
  }

  Widget? _bottomBar(BuildContext context, bool reachable) {
    if (_pending.isEmpty) return null;
    final c = context.em;

    return Container(
      decoration: BoxDecoration(
        color: c.canvas,
        border: Border(top: BorderSide(color: c.hairline)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(Ember.s16),
          child: EmberButton(
            label: reachable
                ? 'Hozir yuborish · ${_pending.length}'
                : 'Aloqa yo\'q — kutilmoqda',
            icon: reachable ? Icons.north_east_rounded : Icons.wifi_off_rounded,
            expand: true,
            loading: _flushing,
            onPressed: reachable ? _flushNow : null,
          ),
        ),
      ),
    );
  }
}

// ── Navbat yozuvini o'qish yordamchilari ────────────────────────────────────

/// Bitta navbat yozuvidagi taomlar (payload ichida, `items`).
List<Map<String, dynamic>> _opItems(Map<String, dynamic> op) {
  final payload = op['payload'];
  if (payload is! Map) return const [];
  final items = payload['items'];
  if (items is! List) return const [];
  return items.whereType<Map>().map((e) => e.cast<String, dynamic>()).toList();
}

num _opTotal(Map<String, dynamic> op) => _opItems(op).fold<num>(
      0,
      (s, it) => s + asNum(it['price'], 0) * asNum(it['quantity'], 0),
    );

int _opQuantity(Map<String, dynamic> op) => _opItems(op).fold<int>(
      0,
      (s, it) => s + asNum(it['quantity'], 0).toInt(),
    );

String? _opTableId(Map<String, dynamic> op) {
  final payload = op['payload'];
  if (payload is! Map) return null;
  final id = payload['table_id'];
  return id == null ? null : '$id';
}

bool _isCreate(Map<String, dynamic> op) => op['type'] == 'create_order';

/// "5 daqiqa oldin" — ofitsiantga aniq vaqtdan ko'ra shu foydaliroq.
String _sinceLabel(String? iso) {
  final at = DateTime.tryParse(iso ?? '');
  if (at == null) return '';
  final d = DateTime.now().difference(at);
  if (d.inMinutes < 1) return 'hozirgina';
  if (d.inMinutes < 60) return '${d.inMinutes} daqiqa oldin';
  if (d.inHours < 24) return '${d.inHours} soat oldin';
  return '${d.inDays} kun oldin';
}

String _clock(String? iso) {
  final at = DateTime.tryParse(iso ?? '')?.toLocal();
  if (at == null) return '';
  return '${at.hour.toString().padLeft(2, '0')}:'
      '${at.minute.toString().padLeft(2, '0')}';
}

// ── Kartalar ────────────────────────────────────────────────────────────────

class _PendingCard extends StatelessWidget {
  final Map<String, dynamic> op;
  final Map<String, String> tableNumbers;

  const _PendingCard({required this.op, required this.tableNumbers});

  @override
  Widget build(BuildContext context) {
    return EmberCard(
      edge: EmberTone.warn,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _OpHeader(op: op, tableNumbers: tableNumbers, tone: EmberTone.warn),
          const SizedBox(height: Ember.s12),
          const EmberHairline(),
          const SizedBox(height: Ember.s12),
          _OpItems(op: op),
          const SizedBox(height: Ember.s12),
          Row(
            children: [
              Text(
                _sinceLabel(op['created_at']?.toString()).toUpperCase(),
                style: context.emText.labelFaint,
              ),
              const Spacer(),
              Text(
                'AVTOMATIK YUBORILADI',
                style: context.emText.label.copyWith(color: context.em.warn),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FailedCard extends StatelessWidget {
  final Map<String, dynamic> op;
  final Map<String, String> tableNumbers;

  const _FailedCard({required this.op, required this.tableNumbers});

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;

    return EmberCard(
      edge: EmberTone.bad,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _OpHeader(op: op, tableNumbers: tableNumbers, tone: EmberTone.bad),
          const SizedBox(height: Ember.s12),
          const EmberHairline(),
          const SizedBox(height: Ember.s12),
          _OpItems(op: op),
          const SizedBox(height: Ember.s12),
          EmberChip(
            text: 'Kassa javobi: ${op['error'] ?? 'noma\'lum xato'}',
            tone: EmberTone.bad,
            icon: Icons.report_gmailerrorred_rounded,
            uppercase: false,
            expand: true,
          ),
          const SizedBox(height: Ember.s8),
          Text(
            'Bu yozuv o\'chirilmaydi — kassir uni qo\'lda kiritishi kerak.',
            style: t.bodyFaint,
          ),
          const SizedBox(height: Ember.s12),
          Row(
            children: [
              Text(
                _sinceLabel(op['created_at']?.toString()).toUpperCase(),
                style: t.labelFaint,
              ),
              const Spacer(),
              Text(
                'RAD ETILDI ${_clock(op['failed_at']?.toString())}',
                style: t.label.copyWith(color: c.bad),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Karta boshi: stol raqami (yoki amal turi) + holat pili.
class _OpHeader extends StatelessWidget {
  final Map<String, dynamic> op;
  final Map<String, String> tableNumbers;
  final EmberTone tone;

  const _OpHeader({
    required this.op,
    required this.tableNumbers,
    required this.tone,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final create = _isCreate(op);
    final tableId = _opTableId(op);
    final number = tableId == null ? null : tableNumbers[tableId];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (create) ...[
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('STOL', style: t.labelFaint),
              const SizedBox(height: Ember.s4),
              Text(
                number ?? '—',
                style: t.numericLg.copyWith(color: emberToneColor(c, tone)),
              ),
            ],
          ),
          const SizedBox(width: Ember.s16),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                create ? 'Yangi buyurtma' : 'Taom qo\'shildi',
                style: t.title,
              ),
              const SizedBox(height: 2),
              Text(
                '${_opQuantity(op)} ta taom · ${Ember.money(_opTotal(op))} so\'m',
                style: t.bodySm,
              ),
            ],
          ),
        ),
        const SizedBox(width: Ember.s8),
        EmberChip(
          text: tone == EmberTone.bad ? 'Yuborilmadi' : 'Kutilmoqda',
          tone: tone,
        ),
      ],
    );
  }
}

/// Taom qatorlari — ofitsiant nima ketayotganini aynan ko'rishi kerak.
class _OpItems extends StatelessWidget {
  final Map<String, dynamic> op;

  const _OpItems({required this.op});

  @override
  Widget build(BuildContext context) {
    final t = context.emText;
    final items = _opItems(op);
    if (items.isEmpty) {
      return Text('Taom ro\'yxati bo\'sh', style: t.bodyFaint);
    }

    return Column(
      children: [
        for (final it in items)
          Padding(
            padding: const EdgeInsets.only(bottom: Ember.s8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 34,
                  child: Text(
                    '${asNum(it['quantity'], 0).toInt()}x',
                    style: t.numericSm,
                  ),
                ),
                Expanded(
                  child: Text(
                    '${it['name'] ?? 'Nomsiz taom'}',
                    style: t.body,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: Ember.s8),
                Text(
                  Ember.money(
                    asNum(it['price'], 0) * asNum(it['quantity'], 0),
                  ),
                  style: t.numeric(size: 14),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
