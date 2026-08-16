import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/services/lan/lan_api_client.dart';
import 'package:mary_ai_pos/core/theme/ember.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/waiter/services/cart_draft_store.dart';
import 'package:mary_ai_pos/waiter/widgets/ember_kit.dart';

/// Buyurtma ekrani — menyudan tanlash va kassaga yuborish.
///
/// Stolda ochiq buyurtma bo'lsa yangi tanlovlar unga **qo'shiladi**
/// (`/orders/{id}/items`), aks holda yangi buyurtma yaratiladi. Ikkala
/// yo'lda ham har bir qatorning klientda berilgan `id` si bor — takroriy
/// yuborishda POS ularni filtrlab tashlaydi.
///
/// Ekran ikki qismga bo'linadi: chapda menyu, o'ngda savat. Tor ekranda
/// savat pastki paneldan ochiladigan varaqqa tushadi.
class OrderScreen extends StatefulWidget {
  final LanApiClient api;
  final Map<String, dynamic> table;

  const OrderScreen({super.key, required this.api, required this.table});

  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

/// Savat doim ko'rinib turadigan kenglik chegarasi (planshet, landshaft).
const double _twoPaneBreakpoint = 900;
const double _cartPaneWidth = 360;

/// Tez-tez yoziladigan izohlar — planshet klaviaturasida terish sekin.
const List<String> _commentSuggestions = [
  'Achchiq emas',
  'Muzsiz',
  'Alohida',
  'Tuzsiz',
  'Issiq',
];

/// Savat diskka yozilishidan oldingi kutish.
///
/// Stepper tez bosilganda har teginish diskka yozuv bo'lsa planshet
/// seziladigan darajada sekinlashadi. Oyna ataylab kichik: ilova shu
/// oraliqda o'ldirilsa oxirgi bitta teginish yo'qoladi, ko'pi emas.
const Duration _draftDebounce = Duration(milliseconds: 400);

/// `intl` ofitsiant ilovasiga ulanmagan — soat:daqiqa uchun paketni
/// tortishning ma'nosi yo'q.
String _hhmm(DateTime t) =>
    '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

class _OrderScreenState extends State<OrderScreen> {
  List<Map<String, dynamic>> _categories = const [];
  List<Map<String, dynamic>> _goods = const [];
  Map<String, dynamic>? _existingOrder;
  String? _selectedCategoryId;
  String _query = '';
  int _guestCount = 1;
  bool _loading = true;
  bool _sending = false;

  final TextEditingController _searchCtrl = TextEditingController();
  StreamSubscription<bool>? _connSub;

  /// good_id → qator. Savat.
  final Map<String, _CartLine> _cart = {};

  Timer? _draftTimer;

  /// Diskdan o'qilgan, lekin hali menyu bilan solishtirilmagan qoralama.
  /// Menyu kelmaguncha ushlab turiladi — narx va nom menyudan olinadi.
  CartDraft? _pendingDraft;

  /// Qoralama tiklangan bo'lsa uning yozilgan vaqti. Savat ustidagi belgi
  /// shundan chiziladi: ofitsiant taomlar qayerdan kelganini bilishi kerak.
  DateTime? _restoredAt;

  /// Savat pastki varaqda ham ko'rsatiladi — u ekran state'idan tashqarida
  /// qurilgani uchun o'zgarishni shu hisoblagich orqali eshitadi.
  final ValueNotifier<int> _rev = ValueNotifier(0);

  String get _tableId => widget.table['id'] as String? ?? '';

  String get _tableNumber => widget.table['number']?.toString() ?? '—';

  @override
  void initState() {
    super.initState();
    _connSub = widget.api.onConnectionChanged.listen((_) {
      // Yuborish tugmasidagi yozuv haqiqatni ko'rsatishi shart.
      if (mounted) setState(() {});
    });
    unawaited(_bootstrap());
  }

  /// Qoralama menyudan **oldin** o'qiladi: `_load` tugagach uni darhol
  /// tiklash uchun. Aks holda ekran bir zum bo'sh savat bilan chizilardi.
  Future<void> _bootstrap() async {
    await CartDraftStore.instance.ensureReady();
    if (!mounted) return;
    _pendingDraft = CartDraftStore.instance.read(
      brandId: widget.api.brandId,
      tableId: _tableId,
    );
    await _load(initial: true);
  }

  @override
  void dispose() {
    // Debounce oynasini kutmasdan yozamiz — ekran yopilishi savatni
    // yo'qotishning eng ko'p uchraydigan sababi.
    _draftTimer?.cancel();
    _persistDraft();
    _connSub?.cancel();
    _searchCtrl.dispose();
    _rev.dispose();
    super.dispose();
  }

  /// [initial] — birinchi yuklash: ekran spinnerga almashadi va mehmon soni
  /// buyurtmadan olinadi. Qayta yuklashda ikkalasi ham qilinmaydi, aks holda
  /// ofitsiantning qo'lda kiritgani ostidan ketardi.
  Future<void> _load({bool initial = false}) async {
    final categories = await widget.api.getCategories();
    // Butun menyu bir marta olinadi: kategoriya va qidiruv klientda
    // filtrlanadi, shu bilan har bir kategoriyaning soni ham bepul chiqadi.
    final goods = await widget.api.getGoods();
    final order = await widget.api.getOrderForTable(_tableId);
    if (!mounted) return;
    setState(() {
      _categories = categories;
      _goods = goods;
      _existingOrder = order;
      if (initial) _guestCount = asInt(order?['guest_count'], 1).clamp(1, 99);
      _loading = false;
    });
    _restoreDraft();
  }

  // ── Qoralama ──────────────────────────────────────────────────────────────

  /// Diskdagi savatni menyu bilan solishtirib tiklaydi.
  ///
  /// Menyu bo'sh bo'lsa (aloqa ham, kesh ham yo'q) hech nima qilinmaydi:
  /// "menyuda yo'q" degan xulosa bilan butun savatni jimgina o'chirish
  /// ofitsiant uchun eng yomon natija bo'lardi. Qoralama keyingi
  /// `_load` gacha kutib turadi.
  void _restoreDraft() {
    final draft = _pendingDraft;
    if (draft == null || _goods.isEmpty) return;
    _pendingDraft = null;

    final restored = restoreDraftLines(draft, _goods);
    if (restored.lines.isEmpty) {
      unawaited(_clearDraft());
      return;
    }

    // Diskdan kelgan holatni qayta diskka yozish shart emas — `_mutate`
    // emas, `_refresh`.
    _refresh(() {
      for (final line in restored.lines) {
        _cart[line.goodId] = _CartLine(
          goodId: line.goodId,
          name: line.name,
          price: line.price,
          quantity: line.quantity,
          comment: line.comment,
        );
      }
      // Mehmon soni faqat yangi buyurtmada ma'noli — ochiq buyurtmada u
      // kassadagi qiymat va uni qoralama bilan bosib bo'lmaydi.
      if (!_isAppend) _guestCount = draft.guestCount.clamp(1, 99);
      _restoredAt = draft.updatedAt;
    });

    final dropped = restored.dropped;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          dropped == 0
              ? 'Saqlangan savat tiklandi'
              : 'Saqlangan savat tiklandi — $dropped ta taom menyuda yo\'q',
        ),
      ),
    );
  }

  void _scheduleDraftSave() {
    _draftTimer?.cancel();
    _draftTimer = Timer(_draftDebounce, _persistDraft);
  }

  /// Savatni darhol diskka yozadi (bo'sh bo'lsa — o'chiradi).
  void _persistDraft() {
    _draftTimer?.cancel();
    final tableId = _tableId;
    if (tableId.isEmpty) return;
    if (_cart.isEmpty) {
      unawaited(_clearDraft());
      return;
    }
    unawaited(
      CartDraftStore.instance.save(
        brandId: widget.api.brandId,
        draft: CartDraft(
          tableId: tableId,
          guestCount: _guestCount,
          lines: [
            for (final l in _cart.values)
              CartDraftLine(
                goodId: l.goodId,
                name: l.name,
                price: l.price,
                quantity: l.quantity,
                comment: l.comment,
              ),
          ],
          updatedAt: DateTime.now(),
        ),
      ),
    );
  }

  Future<void> _clearDraft() {
    _draftTimer?.cancel();
    return CartDraftStore.instance.clear(
      brandId: widget.api.brandId,
      tableId: _tableId,
    );
  }

  // ── Savat ─────────────────────────────────────────────────────────────────

  /// Savatga tegadigan har qanday o'zgarish shu yerdan o'tadi — diskka
  /// yozishning yagona nuqtasi ham shu.
  void _mutate(VoidCallback fn) {
    _refresh(fn);
    _scheduleDraftSave();
  }

  /// Savat mazmuni o'zgarmagan (yoki u diskdan kelgan) qayta chizish.
  void _refresh(VoidCallback fn) {
    setState(fn);
    _rev.value++;
  }

  void _add(Map<String, dynamic> good) {
    final id = good['id'] as String?;
    if (id == null) return;
    _mutate(() {
      final existing = _cart[id];
      if (existing == null) {
        _cart[id] = _CartLine(
          goodId: id,
          name: good['name'] as String? ?? '',
          price: asNum(good['price']),
          quantity: 1,
        );
      } else {
        existing.quantity++;
      }
    });
  }

  void _remove(String goodId) {
    _mutate(() {
      final line = _cart[goodId];
      if (line == null) return;
      if (line.quantity <= 1) {
        _cart.remove(goodId);
      } else {
        line.quantity--;
      }
    });
  }

  void _dropLine(String goodId) => _mutate(() => _cart.remove(goodId));

  num get _cartTotal =>
      _cart.values.fold<num>(0, (s, l) => s + l.price * l.quantity);

  int get _cartCount => _cart.values.fold<int>(0, (s, l) => s + l.quantity);

  // ── Ochiq buyurtma ────────────────────────────────────────────────────────

  /// POS ikki xil shakl qaytaradi: lokal ochiq buyurtma (`name`) va bulutdagi
  /// arxiv detali (`good_name`). Ikkalasi ham bitta ro'yxatga keltiriladi.
  List<_ExistingLine> get _existingLines {
    final items = (_existingOrder?['items'] as List?) ?? const [];
    return items.whereType<Map>().map((raw) {
      final m = raw.cast<String, dynamic>();
      final comment = m['comment']?.toString().trim();
      return _ExistingLine(
        name: (m['name'] ?? m['good_name'])?.toString() ?? 'Nomsiz',
        quantity: asInt(m['quantity'], 1),
        price: asNum(m['price']),
        comment: (comment == null || comment.isEmpty) ? null : comment,
      );
    }).toList();
  }

  num get _existingTotal {
    final direct = _existingOrder?['total_amount'] ?? _existingOrder?['grand_total'];
    if (direct != null) return asNum(direct);
    return _existingLines.fold<num>(0, (s, l) => s + l.price * l.quantity);
  }

  /// Faqat lokal ochiq buyurtmaga qator qo'shsa bo'ladi — arxiv detalining
  /// `id` si boshqa jadvalniki, unga `/orders/{id}/items` yo'q.
  bool get _isAppend =>
      _existingOrder?['id'] is String && _existingOrder?['status'] == 'open';

  bool get _hasExisting => _existingLines.isNotEmpty || _existingOrder != null;

  /// Ochiq buyurtma aslida navbatdagi "soya" — POS uni hali ko'rmagan
  /// (`LanApiClient._enqueueCreate` shunday belgilaydi).
  bool get _existingQueued => _existingOrder?['queued'] == true;

  // ── Menyu filtri ──────────────────────────────────────────────────────────

  List<Map<String, dynamic>> get _visibleGoods {
    final q = _query.trim().toLowerCase();
    return _goods.where((g) {
      if (_selectedCategoryId != null &&
          (g['category_id'] as String?) != _selectedCategoryId) {
        return false;
      }
      if (q.isEmpty) return true;
      return (g['name']?.toString().toLowerCase() ?? '').contains(q);
    }).toList();
  }

  bool get _filterActive =>
      _selectedCategoryId != null || _query.trim().isNotEmpty;

  void _clearFilters() {
    _searchCtrl.clear();
    setState(() {
      _query = '';
      _selectedCategoryId = null;
    });
  }

  // ── Yuborish ──────────────────────────────────────────────────────────────

  String get _sendLabel =>
      widget.api.isReachable ? 'Kassaga yuborish' : 'Navbatga qo\'yish';

  Future<void> _send() async {
    if (_cart.isEmpty || _sending) return;
    setState(() => _sending = true);

    final items = _cart.values
        .map((l) => {
              'good_id': l.goodId,
              'name': l.name,
              'price': l.price,
              'quantity': l.quantity,
              if (l.comment != null) 'comment': l.comment,
            })
        .toList();

    final existingId = _existingOrder?['id'] as String?;
    final bool ok;
    final bool queued;
    final String? error;

    if (existingId != null && _isAppend) {
      final r = await widget.api.appendItems(orderId: existingId, items: items);
      ok = r.ok;
      queued = r.queued;
      error = r.error;
    } else {
      final r = await widget.api.createOrder(
        tableId: _tableId,
        items: items,
        guestCount: _guestCount,
      );
      ok = r.ok;
      queued = r.queued;
      error = r.error;
    }

    if (!mounted) return;
    setState(() => _sending = false);

    if (!ok) {
      // Xato — qoralamaga tegilmaydi: savat ofitsiantda qolishi kerak.
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error ?? 'Yuborilmadi')),
      );
      return;
    }

    // `queued: true` ham muvaffaqiyat: ish outbox'ga o'tdi. Qoralamani
    // qoldirsak ofitsiant stolga qaytganda o'sha taomlarni ko'rar va
    // ikkinchi marta yuborardi.
    _cart.clear();
    _restoredAt = null;
    await _clearDraft();
    if (!mounted) return;

    _showSendResult(queued: queued);
    Navigator.of(context).pop();
  }

  /// Yuborish natijasi ikki xil bo'ladi va ular aralashmasligi kerak:
  /// "kassada" degani taom pishirila boshlandi, "navbatda" degani hali
  /// hech kim ko'rmagan. Ikkalasi bir xil ko'rinsa ofitsiant navbatdagi
  /// buyurtmani tayyor deb o'ylab mehmonni kutdirib qo'yadi.
  void _showSendResult({required bool queued}) {
    final c = context.em;
    final color = queued ? c.warn : c.ok;

    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          backgroundColor: c.raised,
          duration: Duration(seconds: queued ? 6 : 3),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Ember.rMd),
            side: BorderSide(color: color.withValues(alpha: 0.45)),
          ),
          content: Row(
            children: [
              Icon(
                queued ? Icons.schedule_rounded : Icons.check_circle_rounded,
                size: 20,
                color: color,
              ),
              const SizedBox(width: Ember.s12),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      queued ? 'NAVBATGA QO\'YILDI' : 'YUBORILDI',
                      style: context.emText.label.copyWith(color: color),
                    ),
                    const SizedBox(height: Ember.s4),
                    Text(
                      queued
                          ? '$_tableNumber-stol · aloqa tiklanganda kassaga ketadi'
                          : '$_tableNumber-stol · kassa qabul qildi',
                      style: context.emText.bodySm,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
  }

  /// Yuborilmagan savat bilan chiqish. Endi bu ishni yo'qotish emas —
  /// savat qoralama sifatida saqlanadi, shuning uchun dialog ogohlantirish
  /// emas, tanlov beradi: saqlab chiqish yoki ataylab o'chirish.
  Future<void> _confirmLeave() async {
    final action = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Yuborilmagan buyurtma'),
        content: Text(
          'Savatda $_cartCount ta taom bor. Ular saqlanadi va bu stolni '
          'qayta ochganingizda joyida turadi.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop('stay'),
            child: const Text('Qolish'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop('discard'),
            child: const Text('O\'chirish'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop('leave'),
            child: const Text('Saqlab chiqish'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop('send'),
            child: Text(_sendLabel),
          ),
        ],
      ),
    );
    if (!mounted || action == null || action == 'stay') return;
    // `_send` muvaffaqiyatda o'zi yopadi — bu yerda ikkinchi pop qilinmaydi.
    if (action == 'send') {
      await _send();
      return;
    }
    if (action == 'discard') {
      _cart.clear();
      _restoredAt = null;
      await _clearDraft();
      if (!mounted) return;
    } else {
      // `dispose` ham yozadi, lekin bu yerda debounce kutilmaydi.
      _persistDraft();
    }
    Navigator.of(context).pop();
  }

  Future<void> _editComment(_CartLine line) async {
    final ctrl = TextEditingController(text: line.comment ?? '');
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Oshxonaga izoh'),
        content: SizedBox(
          width: 360,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(line.name, style: context.emText.bodySm),
              const SizedBox(height: Ember.s12),
              TextField(
                controller: ctrl,
                autofocus: true,
                maxLength: 120,
                textInputAction: TextInputAction.done,
                decoration: const InputDecoration(
                  hintText: 'Masalan: achchiq emas',
                  counterText: '',
                ),
                onSubmitted: (v) => Navigator.of(ctx).pop(v),
              ),
              const SizedBox(height: Ember.s12),
              Wrap(
                spacing: Ember.s8,
                runSpacing: Ember.s8,
                children: [
                  for (final s in _commentSuggestions)
                    EmberChip(
                      text: s,
                      uppercase: false,
                      onTap: () => ctrl.text = s,
                    ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Bekor'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(ctrl.text),
            child: const Text('Saqlash'),
          ),
        ],
      ),
    );
    ctrl.dispose();
    if (result == null) return;
    final trimmed = result.trim();
    _mutate(() => line.comment = trimmed.isEmpty ? null : trimmed);
  }

  void _openCartSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.85,
      ),
      builder: (sheetCtx) => ValueListenableBuilder<int>(
        valueListenable: _rev,
        builder: (_, _, _) => _cartPane(sheetContext: sheetCtx),
      ),
    );
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= _twoPaneBreakpoint;
    final reachable = widget.api.isReachable;

    return PopScope(
      canPop: _cart.isEmpty,
      onPopInvokedWithResult: (didPop, _) {
        if (didPop) return;
        _confirmLeave();
      },
      child: EmberScaffold(
        title: '$_tableNumber-stol',
        subtitle: _existingQueued
            ? 'Navbatdagi buyurtma'
            : _hasExisting
                ? 'Ochiq buyurtma'
                : 'Yangi buyurtma',
        meta: [
          'MARY AI',
          'STOL $_tableNumber',
          reachable ? 'Ulangan' : 'Aloqa yo\'q',
        ],
        actions: [
          EmberChip(
            text: reachable ? 'Ulangan' : 'Aloqa yo\'q',
            tone: reachable ? EmberTone.ok : EmberTone.bad,
            live: reachable,
            icon: reachable ? null : Icons.cloud_off_rounded,
          ),
        ],
        bottomBar: wide ? null : _bottomBar(),
        body: _loading
            ? _loadingBody()
            : wide
                ? Row(
                    children: [
                      Expanded(child: _menuPane()),
                      Container(
                        width: Ember.hairlineWidth,
                        color: context.em.hairline,
                      ),
                      SizedBox(width: _cartPaneWidth, child: _cartPane()),
                    ],
                  )
                : _menuPane(),
      ),
    );
  }

  Widget _loadingBody() {
    final t = context.emText;
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const EmberSpinner(size: 24),
          const SizedBox(height: Ember.s16),
          Text('MENYU YUKLANMOQDA', style: t.labelFaint),
        ],
      ),
    );
  }

  // ── Menyu ustuni ──────────────────────────────────────────────────────────

  Widget _menuPane() {
    final t = context.emText;
    final goods = _visibleGoods;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            Ember.s16,
            Ember.s16,
            Ember.s16,
            0,
          ),
          child: TextField(
            controller: _searchCtrl,
            textInputAction: TextInputAction.search,
            style: t.body,
            onChanged: (v) => setState(() => _query = v),
            decoration: InputDecoration(
              hintText: 'Taom qidirish',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              suffixIcon: _query.isEmpty
                  ? null
                  : IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      tooltip: 'Tozalash',
                      onPressed: () {
                        _searchCtrl.clear();
                        setState(() => _query = '');
                      },
                    ),
            ),
          ),
        ),
        if (_categories.isNotEmpty)
          EmberFilterStrip(
            items: [
              for (final c in _categories)
                EmberFilterItem(
                  id: c['id'] as String?,
                  label: c['name'] as String? ?? '',
                  count: _countFor(c['id'] as String?),
                ),
            ],
            selectedId: _selectedCategoryId,
            onSelected: (id) => setState(() => _selectedCategoryId = id),
          )
        else
          const SizedBox(height: Ember.s16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: Ember.s16),
          child: EmberSectionRule(
            label: 'Menyu',
            padding: const EdgeInsets.only(bottom: Ember.s12),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('${goods.length} ta', style: t.numericSm),
                const SizedBox(width: Ember.s8),
                TextButton(
                  onPressed: _load,
                  child: const Text('Yangilash'),
                ),
              ],
            ),
          ),
        ),
        Expanded(child: goods.isEmpty ? _goodsEmpty() : _goodsGrid(goods)),
      ],
    );
  }

  int _countFor(String? categoryId) =>
      _goods.where((g) => (g['category_id'] as String?) == categoryId).length;

  Widget _goodsGrid(List<Map<String, dynamic>> goods) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
        Ember.s16,
        0,
        Ember.s16,
        Ember.s16,
      ),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 260,
        mainAxisExtent: 158,
        crossAxisSpacing: Ember.s8,
        mainAxisSpacing: Ember.s8,
      ),
      itemCount: goods.length,
      itemBuilder: (context, i) {
        final good = goods[i];
        final id = good['id'] as String? ?? '';
        return _GoodCard(
          good: good,
          quantity: _cart[id]?.quantity ?? 0,
          onAdd: () => _add(good),
          onRemove: () => _remove(id),
        );
      },
    );
  }

  /// Bo'shlikning sababi har xil — javob ham har xil bo'lishi kerak.
  Widget _goodsEmpty() {
    if (_filterActive) {
      return EmberEmpty(
        title: 'Bu filtrda taom yo\'q',
        message: 'Qidiruv yoki kategoriya bo\'yicha mos taom topilmadi.',
        actionLabel: 'Filtrlarni tozalash',
        onAction: _clearFilters,
      );
    }
    if (!widget.api.isReachable) {
      return EmberEmpty(
        mark: EmberMarkKind.arrowCircleDownLeft,
        tone: EmberTone.bad,
        eyebrow: 'Aloqa yo\'q',
        title: 'Menyu yo\'q',
        message: 'Kassa bilan aloqa yo\'q va saqlangan menyu ham yo\'q.',
        actionLabel: 'Qayta urinish',
        onAction: () async {
          await widget.api.ping();
          await _load();
        },
      );
    }
    return EmberEmpty(
      title: 'Taom topilmadi',
      message: 'Kassa menyusi bo\'sh — menejerga ayting.',
      actionLabel: 'Yangilash',
      onAction: _load,
    );
  }

  // ── Savat ustuni ──────────────────────────────────────────────────────────

  /// `sheetContext` berilgan bo'lsa panel pastki varaq ichida turibdi —
  /// yuborishdan oldin varaqning o'zi yopiladi.
  Widget _cartPane({BuildContext? sheetContext}) {
    final c = context.em;
    final t = context.emText;
    final existing = _existingLines;
    final lines = _cart.values.toList();

    return Container(
      color: sheetContext == null ? c.canvas : Colors.transparent,
      child: Column(
        children: [
          _cartHeader(),
          const EmberHairline(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(
                Ember.s16,
                0,
                Ember.s16,
                Ember.s16,
              ),
              children: [
                if (existing.isNotEmpty) ...[
                  EmberSectionRule(
                    label: _existingQueued ? 'Navbatda' : 'Buyurtmada',
                    tone: _existingQueued ? EmberTone.warn : EmberTone.neutral,
                    trailing: Text(
                      Ember.money(_existingTotal),
                      style: t.numeric(
                        size: 14,
                        color: _existingQueued ? c.warn : c.inkDim,
                      ),
                    ),
                  ),
                  // Bu qatorlar kassada emas, planshetda turibdi. Buni
                  // aytmasak ofitsiant oshxona ularni ko'rgan deb o'ylaydi.
                  if (_existingQueued)
                    const Padding(
                      padding: EdgeInsets.only(bottom: Ember.s8),
                      child: EmberChip(
                        text: 'Kassaga hali yetmagan — aloqa tiklanishi kutilmoqda',
                        tone: EmberTone.warn,
                        icon: Icons.schedule_rounded,
                        uppercase: false,
                        expand: true,
                      ),
                    ),
                  for (final line in existing) _existingTile(line),
                ],
                // Tiklangan savat "o'z-o'zidan paydo bo'lgan" ko'rinmasligi
                // kerak: ofitsiant nima uchun taomlar turganini bilmasa,
                // ularni ikkinchi marta yuborishi mumkin.
                if (_restoredAt != null && _cart.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: Ember.s12),
                    child: EmberChip(
                      text: 'Saqlangan savat · ${_hhmm(_restoredAt!)}',
                      tone: EmberTone.accent,
                      icon: Icons.history_rounded,
                      uppercase: false,
                      expand: true,
                    ),
                  ),
                EmberSectionRule(
                  label: 'Yangi',
                  tone: _cart.isEmpty ? EmberTone.neutral : EmberTone.accent,
                  trailing: Text(
                    Ember.money(_cartTotal),
                    style: t.numeric(
                      size: 14,
                      color: _cart.isEmpty ? c.inkFaint : c.accent,
                    ),
                  ),
                ),
                if (lines.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: Ember.s24),
                    child: Text(
                      'Savat bo\'sh. Menyudan taom tanlang.',
                      style: t.bodyFaint,
                      textAlign: TextAlign.center,
                    ),
                  )
                else
                  for (final line in lines) _cartTile(line),
              ],
            ),
          ),
          const EmberHairline(),
          _cartFooter(sheetContext: sheetContext),
        ],
      ),
    );
  }

  Widget _cartHeader() {
    final t = context.emText;
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Ember.s16,
        Ember.s16,
        Ember.s16,
        Ember.s16,
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('SAVAT', style: t.label),
                const SizedBox(height: Ember.s4),
                Text('$_cartCount ta taom', style: t.numericMd),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('MEHMON', style: t.labelFaint),
              const SizedBox(height: Ember.s4),
              // Mehmon soni faqat yangi buyurtmada yuboriladi — ochiq
              // buyurtmani o'zgartiradigan endpoint yo'q.
              if (_isAppend)
                Text('$_guestCount', style: t.numericMd)
              else
                EmberStepper(
                  value: _guestCount,
                  min: 1,
                  max: 99,
                  size: 40,
                  onMinus: () => _mutate(() => _guestCount--),
                  onPlus: () => _mutate(() => _guestCount++),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _existingTile(_ExistingLine line) {
    final c = context.em;
    final t = context.emText;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Ember.s8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(line.name, style: t.bodySm),
                const SizedBox(height: Ember.s4),
                Text(
                  '${line.quantity} × ${Ember.money(line.price)}',
                  style: t.numeric(size: 12, color: c.inkFaint),
                ),
                if (line.comment != null)
                  Padding(
                    padding: const EdgeInsets.only(top: Ember.s4),
                    child: Text(
                      line.comment!,
                      style: t.bodySm.copyWith(
                        color: c.warn,
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: Ember.s8),
          Text(
            Ember.money(line.price * line.quantity),
            style: t.numeric(size: 14, color: c.inkDim),
          ),
        ],
      ),
    );
  }

  Widget _cartTile(_CartLine line) {
    final c = context.em;
    final t = context.emText;
    return Padding(
      padding: const EdgeInsets.only(top: Ember.s12),
      child: EmberCard(
        padding: const EdgeInsets.all(Ember.s12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(child: Text(line.name, style: t.body)),
                const SizedBox(width: Ember.s8),
                Text(
                  Ember.money(line.price * line.quantity),
                  style: t.numeric(size: 15),
                ),
              ],
            ),
            const SizedBox(height: Ember.s4),
            Text(
              '${line.quantity} × ${Ember.money(line.price)}',
              style: t.numericSm,
            ),
            if (line.comment != null)
              Padding(
                padding: const EdgeInsets.only(top: Ember.s4),
                child: Text(
                  line.comment!,
                  style: t.bodySm.copyWith(
                    color: c.warn,
                    fontStyle: FontStyle.italic,
                    fontSize: 13,
                  ),
                ),
              ),
            const SizedBox(height: Ember.s8),
            Row(
              children: [
                _iconAction(
                  icon: Icons.edit_note_rounded,
                  tooltip: 'Izoh',
                  color: line.comment != null ? c.warn : c.inkDim,
                  onTap: () => _editComment(line),
                ),
                _iconAction(
                  icon: Icons.delete_outline_rounded,
                  tooltip: 'O\'chirish',
                  color: c.inkDim,
                  onTap: () => _dropLine(line.goodId),
                ),
                const Spacer(),
                EmberStepper(
                  value: line.quantity,
                  min: 1,
                  size: 40,
                  onMinus: () => _remove(line.goodId),
                  onPlus: () => _mutate(() => line.quantity++),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _iconAction({
    required IconData icon,
    required String tooltip,
    required Color color,
    required VoidCallback onTap,
  }) {
    return SizedBox(
      width: Ember.hit,
      height: Ember.hit,
      child: IconButton(
        onPressed: onTap,
        tooltip: tooltip,
        icon: Icon(icon, size: 20, color: color),
      ),
    );
  }

  Widget _cartFooter({BuildContext? sheetContext}) {
    final c = context.em;
    final reachable = widget.api.isReachable;
    final hasExisting = _existingLines.isNotEmpty;

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.all(Ember.s16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (hasExisting) ...[
                  EmberStat(
                    value: Ember.money(_existingTotal),
                    label: 'Buyurtmada',
                    valueSize: 18,
                  ),
                  const Spacer(),
                ],
                EmberStat(
                  value: Ember.money(_cartTotal),
                  label: 'Yangi',
                  tone: _cart.isEmpty ? EmberTone.neutral : EmberTone.accent,
                  valueSize: 24,
                  align: hasExisting
                      ? CrossAxisAlignment.end
                      : CrossAxisAlignment.start,
                ),
                if (!hasExisting) const Spacer(),
              ],
            ),
            const SizedBox(height: Ember.s16),
            if (!reachable) ...[
              const EmberChip(
                text: 'Aloqa yo\'q — buyurtma navbatga tushadi',
                tone: EmberTone.warn,
                icon: Icons.schedule_rounded,
                uppercase: false,
                expand: true,
              ),
              const SizedBox(height: Ember.s12),
            ],
            EmberButton(
              label: _sendLabel,
              icon: reachable
                  ? Icons.arrow_forward_rounded
                  : Icons.schedule_rounded,
              expand: true,
              loading: _sending,
              onPressed: _cart.isEmpty
                  ? null
                  : () {
                      // Varaq ochiq bo'lsa `_send` dagi pop uni yopib qo'yardi.
                      if (sheetContext != null) {
                        Navigator.of(sheetContext).pop();
                      }
                      _send();
                    },
            ),
            if (_cart.isEmpty && hasExisting)
              Padding(
                padding: const EdgeInsets.only(top: Ember.s8),
                child: Text(
                  'Yuborish uchun menyudan taom tanlang.',
                  textAlign: TextAlign.center,
                  style: context.emText.bodyFaint.copyWith(
                    fontSize: 13,
                    color: c.inkFaint,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  // ── Tor ekrandagi pastki panel ────────────────────────────────────────────

  Widget? _bottomBar() {
    if (_loading) return null;
    if (_cart.isEmpty && _existingLines.isEmpty) return null;

    final c = context.em;
    final t = context.emText;
    final reachable = widget.api.isReachable;
    final empty = _cart.isEmpty;

    return Container(
      decoration: BoxDecoration(
        color: c.canvas,
        border: Border(top: BorderSide(color: c.hairline)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(Ember.s12),
          child: Row(
            children: [
              Expanded(
                child: InkWell(
                  onTap: _openCartSheet,
                  borderRadius: BorderRadius.circular(Ember.rSm),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Ember.s4,
                      vertical: Ember.s8,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.keyboard_arrow_up_rounded,
                          size: 20,
                          color: c.inkDim,
                        ),
                        const SizedBox(width: Ember.s8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              empty ? 'BUYURTMADA' : '$_cartCount TA YANGI',
                              style: t.label,
                            ),
                            const SizedBox(height: Ember.s4),
                            Text(
                              Ember.money(empty ? _existingTotal : _cartTotal),
                              style: t.numeric(
                                size: 20,
                                color: empty ? c.ink : c.accent,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: Ember.s8),
              if (empty)
                EmberButton(
                  label: 'Ko\'rish',
                  kind: EmberButtonKind.ghost,
                  onPressed: _openCartSheet,
                )
              else ...[
                if (!reachable) ...[
                  const EmberChip(
                    text: 'Navbatga',
                    tone: EmberTone.warn,
                    icon: Icons.schedule_rounded,
                  ),
                  const SizedBox(width: Ember.s8),
                ],
                EmberButton(
                  label: reachable ? 'Yuborish' : 'Navbatga',
                  loading: _sending,
                  onPressed: _send,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _CartLine {
  final String goodId;
  final String name;
  final num price;
  int quantity;
  String? comment;

  _CartLine({
    required this.goodId,
    required this.name,
    required this.price,
    required this.quantity,
    this.comment,
  });
}

/// Kassaga allaqachon yetib borgan qator — o'zgartirib bo'lmaydi.
class _ExistingLine {
  final String name;
  final int quantity;
  final num price;
  final String? comment;

  const _ExistingLine({
    required this.name,
    required this.quantity,
    required this.price,
    this.comment,
  });
}

class _GoodCard extends StatelessWidget {
  final Map<String, dynamic> good;
  final int quantity;
  final VoidCallback onAdd;
  final VoidCallback onRemove;

  const _GoodCard({
    required this.good,
    required this.quantity,
    required this.onAdd,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.em;
    final t = context.emText;
    final selected = quantity > 0;
    final cookTime = asInt(good['cook_time']);

    return EmberCard(
      onTap: onAdd,
      selected: selected,
      padding: const EdgeInsets.all(Ember.s12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Text(
              good['name'] as String? ?? '',
              style: t.body,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (cookTime > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: Ember.s4),
              child: Row(
                children: [
                  Icon(Icons.timer_outlined, size: 13, color: c.inkFaint),
                  const SizedBox(width: Ember.s4),
                  Text('$cookTime DAQ', style: t.labelFaint),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: Text(
                  Ember.money(asNum(good['price'])),
                  style: t.numeric(
                    size: 14,
                    color: selected ? c.accent : c.ink,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: Ember.s4),
              // O'chirilgan "−" hech qanday tanuvchi (recognizer) qo'ymaydi,
              // shuning uchun teginish o'rab turgan `EmberCard` ning
              // `onTap: onAdd` iga tushardi: miqdor 0 bo'lganda "minus"
              // bosgan ofitsiant taomni **qo'shib** yuborardi. Opaque
              // GestureDetector teginishni shu yerda to'xtatadi.
              GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () {},
                child: EmberStepper(
                  value: quantity,
                  size: Ember.hit,
                  onMinus: selected ? onRemove : null,
                  onPlus: onAdd,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
