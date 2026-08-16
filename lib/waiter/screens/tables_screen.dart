import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/waiter/screens/connect_screen.dart';
import 'package:mary_ai_pos/waiter/screens/order_screen.dart';
import 'package:mary_ai_pos/waiter/services/cart_draft_store.dart';
import 'package:mary_ai_pos/waiter/widgets/ember_kit.dart';

/// Qidiruv predikati — widget'siz sinash uchun ataylab toza funksiya.
/// Stol raqami bo'yicha ham, nomi bo'yicha ham qidiradi.
bool tableMatchesQuery(Map<String, dynamic> table, String query) {
  final q = query.trim().toLowerCase();
  if (q.isEmpty) return true;
  final number = table['number']?.toString().toLowerCase() ?? '';
  if (number.contains(q)) return true;
  for (final key in const ['name', 'label', 'table_type']) {
    final v = table[key]?.toString().toLowerCase();
    if (v != null && v.isNotEmpty && v.contains(q)) return true;
  }
  return false;
}

/// Stollarni barqaror tartibda qo'yadi: zal → raqam → id.
///
/// Nega kerak: ro'yxat har 15 soniyada butunlay almashtiriladi. Qisman
/// tartiblashda teng elementlar joy almashadi va ofitsiantning barmog'i
/// ostidan stol "suzib ketadi" — bu noto'g'ri stolga buyurtma degani.
/// Raqam int ham, satr ham bo'lishi mumkin, shuning uchun `asNum`.
List<Map<String, dynamic>> sortWaiterTables(
  List<Map<String, dynamic>> tables,
  List<String> orderedHallIds,
) {
  final sorted = List<Map<String, dynamic>>.from(tables);
  int hallRank(Map<String, dynamic> t) {
    final i = orderedHallIds.indexOf(t['hall_id']?.toString() ?? '');
    return i < 0 ? orderedHallIds.length : i;
  }

  sorted.sort((a, b) {
    final byHall = hallRank(a).compareTo(hallRank(b));
    if (byHall != 0) return byHall;
    final byNumber = asNum(a['number']).compareTo(asNum(b['number']));
    if (byNumber != 0) return byNumber;
    return (a['id']?.toString() ?? '').compareTo(b['id']?.toString() ?? '');
  });
  return sorted;
}

/// Navbat yozuvlaridan stol id'larini ajratadi.
///
/// `create_order` payloadida `table_id` doim bor, `append_items` da esa u
/// faqat stol ma'lum bo'lganda yoziladi (`LanApiClient.appendItems`).
/// Topilmagani belgisiz qoladi: noto'g'ri stolni "navbatda" deb ko'rsatishdan
/// ko'ra hech nima ko'rsatmaslik xavfsizroq.
Set<String> queueTableIds(List<Map<String, dynamic>> operations) {
  final ids = <String>{};
  for (final op in operations) {
    final payload = (op['payload'] as Map?)?.cast<String, dynamic>();
    final id = payload?['table_id']?.toString();
    if (id != null && id.isNotEmpty) ids.add(id);
  }
  return ids;
}

/// Stollar ekrani — ofitsiantning asosiy ish joyi.
///
/// Ma'lumot LAN'dan keladi, lekin POS yetib bo'lmasa keshdan ko'rsatiladi
/// (`LanApiClient._cachedList`). Ya'ni WiFi bir zumga uzilsa ham ekran
/// bo'shab qolmaydi — faqat "eski ma'lumot" deb ochiq aytiladi.
class TablesScreen extends StatefulWidget {
  final LanApiClient api;

  const TablesScreen({super.key, required this.api});

  @override
  State<TablesScreen> createState() => _TablesScreenState();
}

enum _StatusFilter { all, busy, free }

class _TablesScreenState extends State<TablesScreen> {
  List<Map<String, dynamic>> _halls = const [];

  /// Hamma zallar bo'yicha to'liq ro'yxat. Zal filtri klientda qo'llanadi —
  /// aks holda har bir zal uchun alohida kesh kaliti bo'lib, "Barchasi"
  /// ko'rinishi va zal bo'yicha stol sonlari offline'da yo'qolardi.
  List<Map<String, dynamic>> _tables = const [];

  String? _selectedHallId;
  _StatusFilter _status = _StatusFilter.all;
  String _query = '';

  bool _loading = true;
  bool _loadedOnce = false;

  final _searchController = TextEditingController();
  Timer? _refreshTimer;
  StreamSubscription<bool>? _connSub;

  /// Navbat va qoralama holati.
  ///
  /// `pendingOperations` har chaqirilganda butun Hive box'ini skanerlaydi,
  /// shuning uchun u `build` da emas, yangilanish nuqtalarida o'qiladi:
  /// 15 soniyalik timer, aloqa o'zgarishi va ekranga qaytish.
  int _queued = 0;
  int _failed = 0;
  Set<String> _queuedTables = const {};
  Set<String> _failedTables = const {};
  Set<String> _draftTables = const {};

  @override
  void initState() {
    super.initState();
    _syncQueueState();
    _load();
    // Qoralama do'koni ilova boshida ochilmagan — ochilishi bilan setka
    // belgilarini qayta chizamiz.
    unawaited(_prepareDrafts());
    _refreshTimer =
        Timer.periodic(const Duration(seconds: 15), (_) => _load(silent: true));
    _connSub = widget.api.onConnectionChanged.listen((_) {
      if (mounted) setState(_syncQueueState);
    });
  }

  Future<void> _prepareDrafts() async {
    await CartDraftStore.instance.ensureReady();
    if (!mounted) return;
    setState(_syncQueueState);
  }

  void _syncQueueState() {
    final pending = widget.api.pendingOperations;
    final failed = widget.api.failedOperations;
    _queued = pending.length;
    _failed = failed.length;
    _queuedTables = queueTableIds(pending);
    _failedTables = queueTableIds(failed);
    _draftTables = CartDraftStore.instance.tableIds(
      brandId: widget.api.brandId,
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _connSub?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    final halls = await widget.api.getHalls();
    final tables = await widget.api.getTables();
    if (!mounted) return;
    setState(() {
      _halls = halls;
      _tables = sortWaiterTables(
        tables,
        halls.map((h) => h['id']?.toString() ?? '').toList(),
      );
      _loading = false;
      _loadedOnce = true;
      _syncQueueState();
    });
  }

  Future<void> _retry() async {
    await widget.api.ping();
    await _load();
  }

  Future<void> _logout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Chiqish'),
        content: const Text(
          'Qayta kirish uchun PIN kod kerak bo\'ladi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Bekor'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Chiqish'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    await widget.api.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => ConnectScreen(api: widget.api)),
    );
  }

  /// Navbat ekrani boshqa joyda ro'yxatdan o'tkazilgan.
  void _openQueue() => Navigator.pushNamed(context, '/queue');

  // ── Hisob-kitob ───────────────────────────────────────────────────────────

  List<Map<String, dynamic>> get _hallTables => _selectedHallId == null
      ? _tables
      : _tables.where((t) => t['hall_id'] == _selectedHallId).toList();

  List<Map<String, dynamic>> get _visibleTables => _hallTables.where((t) {
        final busy = t['status'] == 'busy';
        if (_status == _StatusFilter.busy && !busy) return false;
        if (_status == _StatusFilter.free && busy) return false;
        return tableMatchesQuery(t, _query);
      }).toList();

  bool get _filtersActive =>
      _selectedHallId != null ||
      _status != _StatusFilter.all ||
      _query.trim().isNotEmpty;

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _selectedHallId = null;
      _status = _StatusFilter.all;
      _query = '';
    });
  }

  String? _hallNameOf(Object? hallId) {
    if (hallId == null) return null;
    for (final h in _halls) {
      if (h['id'] == hallId) {
        final name = h['name']?.toString();
        return (name == null || name.isEmpty) ? null : name;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final userName = widget.api.user?['full_name'] as String? ?? 'Ofitsiant';
    final hallLabel = _selectedHallId == null
        ? 'Barcha zallar'
        : (_hallNameOf(_selectedHallId) ?? 'Zal');

    return EmberScaffold(
      title: 'Stollar',
      subtitle: userName,
      meta: ['Mary AI', hallLabel, _connectionLabel()],
      actions: [
        // Ikki chip ataylab alohida: biri aloqani, ikkinchisi navbatni
        // gapiradi. Ilgari ikkalasi bitta pilga siqilgani uchun "aloqa bor,
        // 3 ta yuborilmoqda" bilan "aloqa yo'q, 3 tasi yotibdi" bir xil
        // ko'rinardi.
        ..._queueChips(),
        _connectionChip(),
        SizedBox(
          width: Ember.hit,
          child: IconButton(
            onPressed: _logout,
            icon: Icon(Icons.logout_rounded, color: c.inkDim, size: 20),
            tooltip: 'Chiqish',
          ),
        ),
      ],
      body: Column(
        children: [
          _summaryStrip(c),
          if (_halls.isNotEmpty) ...[
            EmberFilterStrip(
              items: [
                for (final h in _halls)
                  EmberFilterItem(
                    id: h['id']?.toString(),
                    label: h['name']?.toString() ?? 'Zal',
                    count: _tables
                        .where((t) => t['hall_id'] == h['id'])
                        .length,
                  ),
              ],
              selectedId: _selectedHallId,
              onSelected: (id) => setState(() => _selectedHallId = id),
            ),
            const EmberHairline(),
          ],
          _searchRow(c),
          if (!widget.api.isReachable && _loadedOnce && _tables.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(
                Ember.s16,
                0,
                Ember.s16,
                Ember.s12,
              ),
              child: EmberChip(
                text: 'Aloqa yo\'q — ro\'yxat oxirgi saqlangan holat',
                tone: EmberTone.bad,
                icon: Icons.wifi_off_rounded,
                uppercase: false,
                expand: true,
                onTap: _retry,
              ),
            ),
          Expanded(child: _content(c)),
        ],
      ),
    );
  }

  // ── Yuqoridagi raqamlar lentasi ───────────────────────────────────────────

  Widget _summaryStrip(EmberColors c) {
    final tables = _hallTables;
    final busy = tables.where((t) => t['status'] == 'busy').toList();
    final openTotal = busy.fold<num>(
      0,
      (sum, t) => sum + asNum(t['open_order_total']),
    );
    final queued = _queued;
    final failed = _failed;
    final drafts = _draftTables.length;

    final stats = <Widget>[
      EmberStat(
        value: '${busy.length}',
        unit: '/ ${tables.length}',
        label: 'Band stollar',
        tone: busy.isEmpty ? EmberTone.neutral : EmberTone.warn,
        valueSize: 20,
      ),
      EmberStat(
        value: Ember.money(openTotal),
        unit: 'so\'m',
        label: 'Ochiq summa',
        valueSize: 20,
      ),
      _tappableStat(
        enabled: queued > 0,
        child: EmberStat(
          value: '$queued',
          label: 'Navbatda',
          tone: queued > 0 ? EmberTone.warn : EmberTone.neutral,
          valueSize: 20,
        ),
      ),
      // Yuborilmagan savat — bu xato emas, tugallanmagan ish. Shuning
      // uchun ohang neytral va faqat bor bo'lganda ko'rinadi.
      if (drafts > 0)
        EmberStat(
          value: '$drafts',
          label: 'Qoralama',
          valueSize: 20,
        ),
      // Yuborilmagan yozuv — faqat bor bo'lganda. Nol ko'rsatish uni
      // odatiy holatga aylantirib, e'tiborni o'ldiradi.
      if (failed > 0)
        _tappableStat(
          enabled: true,
          child: EmberStat(
            value: '$failed',
            label: 'Yuborilmagan',
            tone: EmberTone.bad,
            valueSize: 20,
          ),
        ),
    ];

    return Container(
      height: 84,
      decoration: BoxDecoration(
        color: c.canvas,
        border: Border(bottom: BorderSide(color: c.hairline)),
      ),
      padding: const EdgeInsets.symmetric(vertical: Ember.s12),
      child: LayoutBuilder(
        builder: (context, cons) {
          final slot =
              (cons.maxWidth - Ember.s32 - (stats.length - 1) * 25) /
                  stats.length;
          if (slot >= 104) {
            return Row(
              children: [
                const SizedBox(width: Ember.s16),
                for (var i = 0; i < stats.length; i++) ...[
                  if (i > 0) _vRule(c),
                  Expanded(child: stats[i]),
                ],
                const SizedBox(width: Ember.s16),
              ],
            );
          }
          // Tor ekran: qisqartirish o'rniga gorizontal siljitamiz.
          return ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: Ember.s16),
            itemCount: stats.length,
            separatorBuilder: (_, _) => _vRule(c),
            itemBuilder: (_, i) => SizedBox(width: 124, child: stats[i]),
          );
        },
      ),
    );
  }

  Widget _vRule(EmberColors c) => Container(
        width: Ember.hairlineWidth,
        height: 36,
        color: c.hairline,
        margin: const EdgeInsets.symmetric(horizontal: Ember.s12),
      );

  Widget _tappableStat({required bool enabled, required Widget child}) {
    if (!enabled) return child;
    return GestureDetector(
      onTap: _openQueue,
      behavior: HitTestBehavior.opaque,
      child: child,
    );
  }

  // ── Qidiruv va holat filtri ───────────────────────────────────────────────

  Widget _searchRow(EmberColors c) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Ember.s16,
        Ember.s12,
        Ember.s16,
        Ember.s12,
      ),
      child: Row(
        children: [
          Expanded(
            child: SizedBox(
              height: Ember.hit,
              child: TextField(
                controller: _searchController,
                keyboardType: TextInputType.number,
                style: context.emText.numeric(size: 15),
                onChanged: (v) => setState(() => _query = v),
                decoration: InputDecoration(
                  hintText: 'Stol raqami',
                  hintStyle: context.emText.bodySm.copyWith(color: c.inkFaint),
                  isDense: true,
                  constraints: const BoxConstraints(minHeight: Ember.hit),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: Ember.s12,
                  ),
                  prefixIcon: Icon(Icons.search_rounded, size: 18, color: c.inkFaint),
                  prefixIconConstraints: const BoxConstraints(
                    minWidth: 38,
                    minHeight: Ember.hit,
                  ),
                  suffixIcon: _query.isEmpty
                      ? null
                      : IconButton(
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _query = '');
                          },
                          icon: Icon(Icons.close_rounded,
                              size: 18, color: c.inkDim),
                          tooltip: 'Tozalash',
                        ),
                ),
              ),
            ),
          ),
          const SizedBox(width: Ember.s8),
          EmberChip(
            text: 'Band',
            tone: EmberTone.warn,
            solid: _status == _StatusFilter.busy,
            onTap: () => setState(
              () => _status = _status == _StatusFilter.busy
                  ? _StatusFilter.all
                  : _StatusFilter.busy,
            ),
          ),
          const SizedBox(width: Ember.s8),
          EmberChip(
            text: 'Bo\'sh',
            solid: _status == _StatusFilter.free,
            onTap: () => setState(
              () => _status = _status == _StatusFilter.free
                  ? _StatusFilter.all
                  : _StatusFilter.free,
            ),
          ),
        ],
      ),
    );
  }

  // ── Asosiy maydon ─────────────────────────────────────────────────────────

  Widget _content(EmberColors c) {
    if (_loading && !_loadedOnce) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const EmberSpinner(size: 22),
            const SizedBox(height: Ember.s16),
            Text('Yuklanmoqda', style: context.emText.labelFaint),
          ],
        ),
      );
    }

    final visible = _visibleTables;

    return RefreshIndicator(
      onRefresh: _load,
      color: c.accent,
      backgroundColor: c.raised,
      child: visible.isEmpty ? _emptyState() : _tableGrid(visible),
    );
  }

  /// Bo'sh ekranning sababi uch xil bo'ladi va ofitsiantning keyingi harakati
  /// ham uch xil: filtrni tozalash, kassaga borish yoki hech narsa.
  Widget _emptyState() {
    final Widget empty;
    if (_filtersActive) {
      empty = EmberEmpty(
        title: 'Bu filtrda stol yo\'q',
        message: 'Qidiruv yoki zal filtrini o\'zgartiring.',
        actionLabel: 'Filtrlarni tozalash',
        onAction: _clearFilters,
      );
    } else if (!widget.api.isReachable) {
      empty = EmberEmpty(
        mark: EmberMarkKind.arrowCircleDownLeft,
        tone: EmberTone.bad,
        eyebrow: 'Aloqa yo\'q',
        title: 'Kassa bilan aloqa yo\'q',
        message: 'Saqlangan ma\'lumot ham yo\'q. WiFi va kassani tekshiring.',
        actionLabel: 'Qayta urinish',
        onAction: _retry,
      );
    } else {
      empty = EmberEmpty(
        title: 'Stol topilmadi',
        message: 'Kassada bu filialga stol qo\'shilmagan.',
        actionLabel: 'Yangilash',
        onAction: _retry,
      );
    }

    // Pastga tortib yangilash bo'sh holatda ham ishlashi kerak.
    return LayoutBuilder(
      builder: (context, cons) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: cons.maxHeight),
          child: empty,
        ),
      ),
    );
  }

  Widget _tableGrid(List<Map<String, dynamic>> tables) {
    // Zal nomi faqat "Barchasi" ko'rinishida ma'noli — aks holda u har
    // kartada takrorlanadigan shovqin.
    final showHall = _selectedHallId == null && _halls.length > 1;

    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
        Ember.s16,
        0,
        Ember.s16,
        Ember.s24,
      ),
      physics: const AlwaysScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 200,
        childAspectRatio: 1.05,
        crossAxisSpacing: Ember.s12,
        mainAxisSpacing: Ember.s12,
      ),
      itemCount: tables.length,
      itemBuilder: (context, i) {
        final table = tables[i];
        final id = table['id']?.toString() ?? '';
        return _TableCard(
          table: table,
          hallName: showHall ? _hallNameOf(table['hall_id']) : null,
          queued: _queuedTables.contains(id),
          failed: _failedTables.contains(id),
          hasDraft: _draftTables.contains(id),
          onTap: () => _openTable(table),
        );
      },
    );
  }

  Future<void> _openTable(Map<String, dynamic> table) async {
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OrderScreen(api: widget.api, table: table),
      ),
    );
    // Buyurtma berilgan bo'lishi mumkin — stollarni yangilaymiz.
    if (mounted) _load(silent: true);
  }

  // ── Aloqa holati ──────────────────────────────────────────────────────────

  /// Meta lentadagi yozuv — chiplar bilan bir xil gapirishi kerak.
  String _connectionLabel() {
    final parts = <String>[widget.api.isReachable ? 'Ulangan' : 'Aloqa yo\'q'];
    if (_queued > 0) parts.add('Navbatda $_queued');
    if (_failed > 0) parts.add('Yuborilmadi $_failed');
    return parts.join(' · ');
  }

  /// **Faqat** aloqa: POS yozuvlarimizni qabul qila oladimi.
  Widget _connectionChip() {
    if (!widget.api.isReachable) {
      return EmberChip(
        text: 'Aloqa yo\'q',
        tone: EmberTone.bad,
        icon: Icons.wifi_off_rounded,
        onTap: _retry,
      );
    }
    return const EmberChip(text: 'Ulangan', tone: EmberTone.ok, live: true);
  }

  /// **Faqat** navbat: qancha ish hali kassaga yetmagan.
  ///
  /// Rad etilgani navbatdagidan muhimroq — u o'z-o'zidan ketmaydi, kassir
  /// aralashishi kerak, shuning uchun alohida qizil pil.
  List<Widget> _queueChips() {
    final chips = <Widget>[];
    if (_failed > 0) {
      chips.add(
        EmberChip(
          text: 'Yuborilmadi · $_failed',
          tone: EmberTone.bad,
          icon: Icons.error_outline_rounded,
          onTap: _openQueue,
        ),
      );
    }
    if (_queued > 0) {
      // Aloqa bor bo'lsa navbat hozir bo'shatilmoqda, aloqa yo'q bo'lsa u
      // kutmoqda. Ofitsiant uchun bu ikki xil kutish.
      final sending = widget.api.isReachable;
      chips.add(
        EmberChip(
          text: sending ? 'Yuborilmoqda · $_queued' : 'Navbatda · $_queued',
          tone: EmberTone.warn,
          icon: sending ? Icons.sync_rounded : Icons.schedule_rounded,
          live: sending,
          onTap: _openQueue,
        ),
      );
    }
    if (chips.isEmpty) return const [];
    return [
      for (final chip in chips) ...[chip, const SizedBox(width: Ember.s8)],
    ];
  }
}

/// Stol kartasi. Band stol "gapiradi" (qirra, summa, warn rangi), bo'sh stol
/// esa ataylab jim: fon sahifa bilan bir xil, raqam so'ngan rangda.
///
/// Uch qo'shimcha holat bor va ular aralashmasligi kerak:
///   * [failed] — POS rad etgan, kassir aralashishi kerak (qizil);
///   * [queued] — yuborilgan, lekin hali kassaga yetmagan (sariq);
///   * [hasDraft] — umuman yuborilmagan savat planshetda yotibdi (accent).
class _TableCard extends StatelessWidget {
  final Map<String, dynamic> table;
  final String? hallName;
  final bool queued;
  final bool failed;
  final bool hasDraft;
  final VoidCallback onTap;

  const _TableCard({
    required this.table,
    required this.onTap,
    this.hallName,
    this.queued = false,
    this.failed = false,
    this.hasDraft = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final busy = table['status'] == 'busy';
    final rawTotal = table['open_order_total'];
    final total = rawTotal == null ? null : asNum(rawTotal);
    final number = table['number']?.toString() ?? '—';
    final capacity = table['capacity'] == null ? null : asInt(table['capacity']);

    final (EmberTone? edge, Color? border) = switch ((failed, queued, busy)) {
      (true, _, _) => (EmberTone.bad, c.bad.withValues(alpha: 0.45)),
      (_, true, _) => (EmberTone.warn, c.warn.withValues(alpha: 0.45)),
      (_, _, true) => (EmberTone.warn, c.warn.withValues(alpha: 0.45)),
      _ => (null, null),
    };

    return EmberCard(
      onTap: onTap,
      edge: edge,
      padding: const EdgeInsets.all(Ember.s12),
      background: busy || queued || failed ? null : c.surface,
      borderColor: border,
      child: LayoutBuilder(
        builder: (context, cons) {
          final tight = cons.maxHeight < 120;
          final numberSize = tight ? 24.0 : 30.0;

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    number,
                    style: t.numeric(
                      size: numberSize,
                      color: busy || queued || failed ? c.ink : c.inkDim,
                    ),
                  ),
                  const Spacer(),
                  // Yuborilmagan savat belgisi — stolni ochmasdan turib
                  // tugallanmagan ish borligi ko'rinishi kerak.
                  if (hasDraft)
                    Padding(
                      padding: const EdgeInsets.only(top: 4, right: Ember.s4),
                      child: Icon(
                        Icons.edit_note_rounded,
                        size: 16,
                        color: c.accent,
                      ),
                    ),
                  if (hallName != null)
                    Flexible(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(
                          hallName!.toUpperCase(),
                          style: t.labelFaint,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                        ),
                      ),
                    ),
                ],
              ),
              const Spacer(),
              Row(
                children: [
                  if (failed || queued) ...[
                    Icon(
                      failed
                          ? Icons.error_outline_rounded
                          : Icons.schedule_rounded,
                      size: 13,
                      color: failed ? c.bad : c.warn,
                    ),
                    const SizedBox(width: Ember.s4),
                  ],
                  // Expanded (Spacer emas): eng uzun yozuv "Yuborilmadi",
                  // unga qolgan butun kenglik berilishi kerak.
                  Expanded(
                    child: Text(
                      failed
                          ? 'Yuborilmadi'
                          : queued
                              ? 'Navbatda'
                              : busy
                                  ? 'Band'
                                  : 'Bo\'sh',
                      style: t.label.copyWith(
                        color: failed
                            ? c.bad
                            : (queued || busy) ? c.warn : c.inkFaint,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: Ember.s4),
                  if (capacity != null && capacity > 0) ...[
                    Icon(
                      Icons.person_outline_rounded,
                      size: 13,
                      color: c.inkFaint,
                    ),
                    const SizedBox(width: 2),
                    Text('$capacity', style: t.numericSm),
                  ],
                ],
              ),
              if (busy || queued) ...[
                const SizedBox(height: Ember.s8),
                Text(
                  // Summa yo'q bo'lishi mumkin: stol kassada band, lekin
                  // lokal do'konda ochiq buyurtmasi yo'q. Nolni o'ylab
                  // topmaymiz.
                  total == null ? '—' : Ember.money(total),
                  style: t.numeric(
                    size: tight ? 13 : 15,
                    color: failed ? c.bad : c.warn,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          );
        },
      ),
    );
  }
}
