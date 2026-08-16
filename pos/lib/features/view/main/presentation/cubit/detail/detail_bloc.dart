import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:rxdart/rxdart.dart';
import 'package:dio/dio.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'dart:convert';

import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/services/offline_queue/offline_queue_service.dart';
import 'package:mary_ai_pos/core/services/offline_queue/pending_operation.dart';
import 'package:mary_ai_pos/di.dart' show inject;
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/usecase/usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/food_additional/food_additional_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/goods/goods_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/save_order/save_order_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/save_order_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_categories_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_goods_by_category_id_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_goods_with_name_usecase.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archive_detail/archive_detail_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_payment_detail_with_table_id_usecase.dart';

part 'detail_event.dart';
part 'detail_state.dart';
part 'detail_bloc.freezed.dart';

EventTransformer<T> debounce<T>(Duration duration) {
  return (events, mapper) => events.debounceTime(duration).switchMap(mapper);
}

class DetailBloc extends Bloc<DetailEvent, DetailState> {
  final GetCategoriesUsecase _getCategoriesUsecase;
  final GetGoodsByCategoryIdUseCase _getGoodsByCategoryIdUseCase;
  final GetGoodsWithNameUseCase _getGoodsWithNameUseCase;
  final GetPaymentDetailWithTableIdUsecase _getPaymentDetailWithTableIdUsecase;
  final CacheService _cache;

  /// Ofitsiant LAN orqali bergan va POS'da offline yaratilgan buyurtmalar
  /// shu yerda yotadi. Usiz kassir stolni "band" ko'radi-yu, ichini
  /// ko'rmaydi va chekni yopa olmaydi.
  final LocalOrderStore _localOrders;

  ArchiveDetailEntity? lastDetail;

  // Duplikat /orders/table/{id} + /bills/{id} chaqiriqlarini kamaytirish uchun
  DateTime? _lastBillFetchAt;
  String? _lastBillFetchTableId;
  static const _billFetchThrottle = Duration(seconds: 15);

  // Kategoriyani tez-tez tanlashda /goods ga burst so'rov yubormaslik uchun
  DateTime? _lastCategoryFetchAt;
  String? _lastCategoryFetchId;
  static const _categoryFetchThrottle = Duration(seconds: 10);

  // Existing item +/- backend sinxronizatsiya uchun:
  // - `_existingLineInfo`: UI itemining goods.name → underlying line item id'lari,
  //   good_id, va serverdagi joriy qty. Har bir /bills/{id} refetch dan keyin
  //   `_enrichExistingGoodsWithLineDetails` da yangilanadi.
  // - `_existingSnapshots`: foydalanuvchi tugmani bosgan paytdagi server holati
  //   (debounce davomida saqlanadi). Debounce tugagach, joriy UI qty bilan
  //   solishtirib net delta hisoblanadi.
  // - `_existingSyncTimers`: har bir item uchun debounce taymeri.
  final Map<String, _ExistingLineInfo> _existingLineInfo = {};
  final Map<String, _ExistingSnapshot> _existingSnapshots = {};
  final Map<String, Timer> _existingSyncTimers = {};
  static const _existingSyncDebounce = Duration(milliseconds: 500);

  DetailBloc(
    this._getCategoriesUsecase,
    this._getGoodsByCategoryIdUseCase,
    this._getGoodsWithNameUseCase,
    this._getPaymentDetailWithTableIdUsecase,
    this._cache,
    this._localOrders,
  ) : super(const DetailState()) {
    on<_Started>(_onStarted);
    on<_GetCategories>(_onGetCategories);
    on<_InitSavedGoods>(_onInitSavedGoods);
    on<_FetchBillOrders>(_onFetchBillOrders);
    on<_SetActiveOrderId>(_onSetActiveOrderId);
    on<_CancelOrderItem>(_onCancelOrderItem);
    on<_SetSelectedCategoryId>(_onSetSelectedCategoryId);
    on<_AddFoodAdditional>(_onAddFoodAdditional);
    on<_SelectGood>(_onSelectGood);
    on<_IncrementQuantity>(_onIncrementQuantity);
    on<_DecrementQuantity>(_onDecrementQuantity);
    on<_IncrementExistingItem>(_onIncrementExistingItem);
    on<_DecrementExistingItem>(_onDecrementExistingItem);
    on<_DeleteExistingItem>(_onDeleteExistingItem);
    on<_SetExistingItemQuantity>(_onSetExistingItemQuantity);
    on<_SyncExistingItem>(_onSyncExistingItem);
    on<_ClearGoods>(_onClearGoods);

    // Debounce the search events so we don't spam the API or local filter directly
    on<_SearchTextChanged>(
      _onSearchTextChanged,
      transformer: debounce(const Duration(milliseconds: 500)),
    );
  }

  void _onStarted(_Started event, Emitter<DetailState> emit) {
    emit(state.copyWith(textController: TextEditingController()));
  }

  Future<void> _onGetCategories(
    _GetCategories event,
    Emitter<DetailState> emit,
  ) async {
    // Cache-first: darhol ko'rsat
    final cachedCats = _cache.getCategories();
    if (cachedCats.isNotEmpty) {
      final cats = [
        const CategoryModel(id: "all", name: "Hammasi"),
        ...cachedCats.map((e) => CategoryModel.fromJson(e)),
      ];
      emit(state.copyWith(status: Status.SUCCESS, categories: cats));
      if (state.selectedCategoryId == null) {
        add(DetailEvent.setSelectedCategoryId(id: cats.first.id));
      }
    } else {
      emit(state.copyWith(status: Status.OTHER_LOADING));
    }

    // Orqa fonda network dan yangilanadi
    final result = await _getCategoriesUsecase(NoParams());
    if (isClosed) return;
    result.fold(
      (failure) {
        if (cachedCats.isEmpty && !isClosed) {
          emit(state.copyWith(status: Status.ERROR, failure: failure));
        }
      },
      (categories) {
        if (isClosed) return;
        _cache.saveCategories(
          categories.map((c) => {'id': c.id, 'name': c.name}).toList(),
        );
        categories.insert(0, const CategoryModel(id: "all", name: "Hammasi"));
        emit(state.copyWith(status: Status.SUCCESS, categories: categories));
        if (state.selectedCategoryId == null && categories.isNotEmpty) {
          add(DetailEvent.setSelectedCategoryId(id: categories.first.id));
        }
      },
    );
  }

  void _onInitSavedGoods(_InitSavedGoods event, Emitter<DetailState> emit) {
    emit(state.copyWith(selectedGoods: event.savedGoods));
  }

  void _onSetActiveOrderId(_SetActiveOrderId event, Emitter<DetailState> emit) {
    if (state.activeOrderId == event.orderId) return;
    emit(state.copyWith(activeOrderId: event.orderId));
  }

  Future<void> _onFetchBillOrders(
    _FetchBillOrders event,
    Emitter<DetailState> emit,
  ) async {
    // Cache-first: avval saqlangan detalni ko'rsat.
    // `force: true` paytida cache-first emit qilmaymiz — bu mutatsiya
    // (item +/- yoki delete) dan keyingi refetch. Cache hali eski qty saqlasa,
    // optimistik UI ustidan eski qiymat qisqacha "miltillab" ko'rinardi.
    // Lokal ochiq buyurtma — ofitsiantdan LAN orqali kelgan yoki offline
    // yaratilgan. Cloud undan xabarsiz bo'lishi mumkin.
    final local = _localOrders.openOrderForTable(event.billId);

    // Kesh stol bo'yicha kalitlanadi, ya'ni oldingi (yopilgan) buyurtmadan
    // qolgan bo'lishi mumkin. Lokal buyurtma hali cloudda yo'q bo'lsa,
    // keshdagi detal aniq boshqa buyurtmaniki — unga ishonmaymiz, aks holda
    // kassir yopilgan chekning taomlarini ko'rardi.
    final staleCache = local != null && !local.cloudCreated;
    final cached = staleCache ? null : _cache.getOrderDetail(event.billId);

    if (cached != null && !event.force) {
      _applyDetailToState(ArchiveDetailModel.fromJson(cached), event.billId, emit);
    } else if (local != null && !event.force) {
      // Cloudda hali yo'q — chekni lokal yozuvdan chizamiz.
      _applyLocalOnly(local, emit);
    }

    // Throttle: shu tableId uchun 15s ichida takroriy /bills/ + /orders/table/
    // chaqiriqlari bloklanadi (widget rebuild dan kelgan duplicate eventlarni yutadi).
    // `force: true` — user mutatsiyasi (item qo'shildi/bekor qilindi) dan keyin
    // throttle'ni chetlab o'tamiz, yangi state darhol yuklanishi kerak.
    // Agar cache yo'q bo'lsa (masalan transfer keyin evict qilindi) — ham
    // throttle'ni chetlab o'tamiz, serverdan yangi ma'lumot olish shart.
    final cacheWasAbsent = cached == null;
    if (!event.force &&
        !cacheWasAbsent &&
        _lastBillFetchTableId == event.billId &&
        _lastBillFetchAt != null &&
        DateTime.now().difference(_lastBillFetchAt!) < _billFetchThrottle) {
      return;
    }
    _lastBillFetchTableId = event.billId;
    _lastBillFetchAt = DateTime.now();

    final result = await _getPaymentDetailWithTableIdUsecase.call(event.billId);
    if (isClosed) return;
    String? orderIdForTimestamps;
    result.fold(
      (_) {
        // Cloud javob bermadi. Kesh ko'rsatilgan bo'lsa yetarli; bo'lmasa
        // lokal yozuv yagona haqiqat — kassir chekni ko'rishi shart.
        if (isClosed || cached != null) return;
        final fresh = _localOrders.openOrderForTable(event.billId);
        if (fresh != null) _applyLocalOnly(fresh, emit);
      },
      (detail) {
        if (isClosed) return;
        lastDetail = detail;
        _cache.saveOrderDetail(event.billId, (detail as ArchiveDetailModel).toJson());
        // Serverdan yangi kelgan detal — unga ishonamiz.
        //
        // Bu yerda ilgari `staleCache` bo'lsa server detali **tashlab
        // yuborilardi**. Kesh eskirgan bo'lishi mumkin, lekin hozir olingan
        // javob eskirmagan: uni tashlash kassirning o'z taomlarini chekdan
        // yo'qotardi. `_applyDetailToState` server qatorlari ustiga faqat
        // hali yetkazilmagan lokal qatorlarni qo'shadi, ya'ni ikkilanish
        // bo'lmaydi va hech narsa tushib qolmaydi.
        _applyDetailToState(detail, event.billId, emit);
        orderIdForTimestamps = detail.id;
      },
    );

    // Bill javobida items.created_at yo'q — `/api/v1/order-items/order/{id}`
    // endpoint'idan timestamplarni olib, ko'rsatilgan itemlar ustidan merge
    // qilamiz. Aks holda foydalanuvchi vaqtni ko'rmaydi.
    if (orderIdForTimestamps != null && orderIdForTimestamps!.isNotEmpty) {
      await _enrichExistingGoodsWithTimestamps(orderIdForTimestamps!, emit);
    }
  }

  Future<void> _enrichExistingGoodsWithTimestamps(
    String orderId,
    Emitter<DetailState> emit,
  ) async {
    try {
      final res = await inject<DioClient>().get(
        ListAPI.orderItemsListByOrder(orderId),
      );
      if (isClosed) return;
      final raw = res.data['data'];
      final List<dynamic> list = raw is List
          ? raw
          : (raw is Map<String, dynamic> && raw['items'] is List
              ? raw['items'] as List
              : const []);
      // name -> earliest createdAt
      final tsByName = <String, DateTime>{};
      // name -> aggregated server-side info (line ids, good_id, total qty)
      // /api/v1/order-items/order/{id} har bir line uchun good_id qaytaradi —
      // increment/decrement uchun zarur (bekor qilish + qayta yaratish).
      final infoByName = <String, _ExistingLineInfo>{};
      for (final entry in list.whereType<Map>()) {
        final m = Map<String, dynamic>.from(entry);
        final name = (m['good_name'] ?? m['name'] ?? '').toString();
        if (name.isEmpty) continue;
        final status = (m['status'] ?? '').toString().toLowerCase();
        if (status == 'cancelled') continue; // bekor qilingan — ko'rsatmaymiz
        final lineId = (m['id'] ?? '').toString();
        final goodId = (m['good_id'] ?? '').toString();
        final qty = (m['quantity'] as num?)?.toInt() ?? 0;
        final comment = (m['comment'] ?? '').toString();

        final rawDate = m['created_at'] ?? m['createdAt'];
        DateTime? created;
        if (rawDate is String && rawDate.isNotEmpty) {
          created = DateTime.tryParse(rawDate)?.toLocal();
        }
        if (created != null) {
          final existingTs = tsByName[name];
          if (existingTs == null || created.isBefore(existingTs)) {
            tsByName[name] = created;
          }
        }

        if (lineId.isEmpty || goodId.isEmpty) continue;
        final existing = infoByName[name];
        if (existing == null) {
          infoByName[name] = _ExistingLineInfo(
            goodId: goodId,
            comment: comment,
            lineIds: [lineId],
            totalQuantity: qty,
          );
        } else {
          existing.lineIds.add(lineId);
          infoByName[name] = existing.copyWith(
            totalQuantity: existing.totalQuantity + qty,
            // Birinchi line'ning comment'ini saqlaymiz (oddiy holatda barcha
            // line'lar bir xil mahsulot uchun bir xil good_id ga ega).
          );
        }
      }

      // Line-info xaritasi — debounce snapshot lardan tashqari foydalaniladi
      _existingLineInfo
        ..clear()
        ..addAll(infoByName);

      if (tsByName.isEmpty || isClosed) return;

      // Cache'ga saqlaymiz — offline'da ham itemlar uchun vaqt ko'rinadi
      await _cache.saveItemTimestamps(orderId, tsByName);

      final updated = state.existingGoods.map((g) {
        // Offline pending itemlar (⏳ prefix) o'z timestamp'iga ega — tegmaymiz
        if (g.commet == 'pending_offline') return g;
        final t = tsByName[g.goods.name];
        if (t == null) return g;
        return g.copyWith(createdAt: t);
      }).toList();
      emit(state.copyWith(existingGoods: updated));
    } catch (_) {
      // Endpoint ishlamasa yoki javob noto'g'ri — sukut bilan o'tamiz
    }
  }

  /// Server/cache detail + offline queue itemlarni birlashtiradi.
  /// Bir xil mahsulotlarni guruhlaydi (x2, x3 ko'rinishida).
  void _applyDetailToState(
    ArchiveDetailModel detail,
    String tableId,
    Emitter<DetailState> emit,
  ) {
    // Cache'da saqlangan timestamplar — offline rejimda ham vaqtlar ko'rinadi
    final cachedTs = _cache.getItemTimestamps(detail.id);

    // 1. Server itemlarini guruhlash: bir xil nom → miqdorini qo'sh
    final Map<String, OrderItem> grouped = {};
    for (final g in detail.goods) {
      if (g.status == 'cancelled') continue; // cancelled — ko'rsatmaymiz
      final key = g.name;
      // Bill javobida `created_at` yo'q, lekin avvalgi sessiyada
      // `/order-items/order/{id}` orqali olingan vaqt cache'da bo'lishi mumkin
      final ts = g.createdAt ?? cachedTs[g.name];
      if (grouped.containsKey(key)) {
        // Bir xil nomli itemlar guruhlansa — eng erta qo'shilgan vaqtni
        // saqlaymiz (foydalanuvchi "qachon birinchi marta urilgan" ni ko'radi).
        final existing = grouped[key]!;
        final earliest = _earlier(existing.createdAt, ts);
        grouped[key] = existing.copyWith(
          quantity: existing.quantity + g.quantity,
          createdAt: earliest,
        );
      } else {
        grouped[key] = OrderItem(
          uniqueId: g.id,
          goods: GoodsModel(
            id: g.id,
            name: g.name,
            price: g.price.toString(),
            categoryId: '',
            cookTime: 0,
            costPrice: '0',
            description: '',
            profit: '0',
            profitMargin: '0',
          ),
          quantity: g.quantity,
          commet: g.status,
          comment: g.comment,
          createdAt: ts,
        );
      }
    }

    // 2. Offline queue dan ushbu stol uchun kutayotgan itemlar
    final queue = inject<OfflineQueueService>();
    final cachedGoods = _cache.getGoods();
    final pending = queue.pending.where(
      (op) => op.tableId == tableId && op.type == PendingOperationType.addItems,
    );
    for (final op in pending) {
      try {
        final payload = jsonDecode(op.payload) as Map<String, dynamic>;
        final items = payload['items'] as List<dynamic>;
        for (final item in items) {
          final goodId = item['good_id'] as String;
          final qty = (item['quantity'] as num).toInt();
          final goodJson = cachedGoods.firstWhere(
            (g) => g['id'] == goodId,
            orElse: () => <String, dynamic>{},
          );
          if (goodJson.isEmpty) continue;
          final name = goodJson['name'] as String? ?? goodId;
          final price = goodJson['price']?.toString() ?? '0';
          final key = '⏳$name'; // prefix — offline itemlar boshqa key
          if (grouped.containsKey(key)) {
            final existing = grouped[key]!;
            grouped[key] = existing.copyWith(
              quantity: existing.quantity + qty,
              createdAt: _earlier(existing.createdAt, op.createdAt),
            );
          } else {
            grouped[key] = OrderItem(
              uniqueId: '${op.id}_$goodId',
              goods: GoodsModel(
                id: goodId,
                name: '⏳ $name',
                price: price,
                categoryId: '',
                cookTime: 0,
                costPrice: '0',
                description: '',
                profit: '0',
                profitMargin: '0',
              ),
              quantity: qty,
              commet: 'pending_offline',
              createdAt: op.createdAt,
            );
          }
        }
      } catch (_) {}
    }

    // 3. Lokal ombordagi, cloudga hali yetmagan qatorlar.
    //
    // Faqat `unsyncedItems` — cloudga yetkazilganlari serverning javobida
    // allaqachon bor, ikkalasini qo'shsak chek ikki barobar bo'lardi.
    final local = _localOrders.openOrderForTable(tableId);
    if (local != null) {
      _mergeLocalItems(local.unsyncedItems, local.clientCreatedAt, grouped);
    }

    if (!isClosed) {
      emit(state.copyWith(
        existingGoods: grouped.values.toList(),
        activeOrderId: detail.id,
      ));
    }
  }

  /// Cloudda hali yo'q buyurtma — chek butunlay lokal yozuvdan chiziladi.
  void _applyLocalOnly(LocalOrder order, Emitter<DetailState> emit) {
    final grouped = <String, OrderItem>{};
    _mergeLocalItems(order.items, order.clientCreatedAt, grouped);
    if (isClosed) return;
    emit(state.copyWith(
      existingGoods: grouped.values.toList(),
      activeOrderId: order.id,
    ));
  }

  /// Lokal qatorlarni `grouped` ga qo'shadi. Nom bo'yicha guruhlanadi va
  /// `⏳` bilan belgilanadi — kassir bu taomlar hali cloudga yetmaganini
  /// ko'rib turishi kerak, jimgina "yuborilgan" ko'rinishida bo'lmasin.
  void _mergeLocalItems(
    List<Map<String, dynamic>> items,
    DateTime createdAt,
    Map<String, OrderItem> grouped,
  ) {
    if (items.isEmpty) return;
    final cachedGoods = _cache.getGoods();

    for (final item in items) {
      final goodId = item['good_id']?.toString() ?? '';
      if (goodId.isEmpty) continue;
      final qty = (item['quantity'] as num?)?.toInt() ?? 0;
      if (qty <= 0) continue;

      // Nom va narx ofitsiantdan kelgan bo'lishi mumkin; bo'lmasa keshdan.
      final goodJson = cachedGoods.firstWhere(
        (g) => g['id'] == goodId,
        orElse: () => <String, dynamic>{},
      );
      final name = (item['name'] as String?)?.isNotEmpty == true
          ? item['name'] as String
          : (goodJson['name'] as String? ?? goodId);
      final price = item['price']?.toString().isNotEmpty == true
          ? item['price'].toString()
          : (goodJson['price']?.toString() ?? '0');

      final ts = DateTime.tryParse(item['created_at']?.toString() ?? '')
              ?.toLocal() ??
          createdAt;

      final key = '⏳$name';
      final existing = grouped[key];
      if (existing != null) {
        grouped[key] = existing.copyWith(
          quantity: existing.quantity + qty,
          createdAt: _earlier(existing.createdAt, ts),
        );
      } else {
        grouped[key] = OrderItem(
          uniqueId: item['id']?.toString() ?? '${goodId}_$qty',
          goods: GoodsModel(
            id: goodId,
            name: '⏳ $name',
            price: price,
            categoryId: '',
            cookTime: 0,
            costPrice: '0',
            description: '',
            profit: '0',
            profitMargin: '0',
          ),
          quantity: qty,
          commet: 'pending_offline',
          comment: item['comment']?.toString() ?? '',
          createdAt: ts,
        );
      }
    }
  }

  /// Legacy event — `_DeleteExistingItem` bilan bir xil ishlaydi (UI shu eventni
  /// yuborib mahsulotni to'liq o'chiradi). Eski kod yo'llari uchun saqlandi.
  Future<void> _onCancelOrderItem(
    _CancelOrderItem event,
    Emitter<DetailState> emit,
  ) async {
    await _deleteExistingByKey(
      itemKey: event.itemId,
      tableId: event.tableId,
      emit: emit,
    );
  }

  // ─── Existing item +/- / delete (backend bilan sinxron) ──────────────

  /// Optimistic +1. Server bilan sinxronlash debounce orqali keyinroq.
  /// `existingSyncingNames` darhol set qilinadi — UI tugmalar zudlik bilan
  /// disable bo'ladi, refetch tugaguncha boshqa click qabul qilinmaydi.
  void _onIncrementExistingItem(
    _IncrementExistingItem event,
    Emitter<DetailState> emit,
  ) {
    final idx = state.existingGoods.indexWhere(
      (g) => g.uniqueId == event.itemKey,
    );
    if (idx == -1) return;
    final item = state.existingGoods[idx];
    if (item.commet == 'cancelled' || item.commet == 'pending_offline') return;
    if (state.existingSyncingNames.contains(item.goods.name)) return;
    _captureSnapshotIfNeeded(item);
    final updated = List<OrderItem>.from(state.existingGoods);
    updated[idx] = item.copyWith(quantity: item.quantity + 1);
    emit(state.copyWith(
      existingGoods: updated,
      existingSyncingNames: {
        ...state.existingSyncingNames,
        item.goods.name,
      },
    ));
    _scheduleExistingSync(event.itemKey, event.tableId);
  }

  /// Optimistic -1. Agar qty 1 da bo'lsa — itemni listdan olib tashlaymiz va
  /// server'ga delete yuborish uchun snapshot saqlanib qoladi (sync handler
  /// barcha line'larni bekor qiladi).
  void _onDecrementExistingItem(
    _DecrementExistingItem event,
    Emitter<DetailState> emit,
  ) {
    final idx = state.existingGoods.indexWhere(
      (g) => g.uniqueId == event.itemKey,
    );
    if (idx == -1) return;
    final item = state.existingGoods[idx];
    if (item.commet == 'cancelled' || item.commet == 'pending_offline') return;
    if (state.existingSyncingNames.contains(item.goods.name)) return;
    _captureSnapshotIfNeeded(item);
    final newQty = item.quantity - 1;
    final updated = List<OrderItem>.from(state.existingGoods);
    if (newQty <= 0) {
      updated.removeAt(idx);
    } else {
      updated[idx] = item.copyWith(quantity: newQty);
    }
    emit(state.copyWith(
      existingGoods: updated,
      existingSyncingNames: {
        ...state.existingSyncingNames,
        item.goods.name,
      },
    ));
    _scheduleExistingSync(event.itemKey, event.tableId);
  }

  Future<void> _onDeleteExistingItem(
    _DeleteExistingItem event,
    Emitter<DetailState> emit,
  ) async {
    await _deleteExistingByKey(
      itemKey: event.itemKey,
      tableId: event.tableId,
      emit: emit,
    );
  }

  /// Edit-modaldan "Saqlash" bosilganda — yangi miqdorni darhol qo'llaydi va
  /// backendga sinxronlash uchun `_SyncExistingItem` ni navbatga qo'yadi
  /// (debouncesiz, chunki user aniq tasdiq berdi).
  void _onSetExistingItemQuantity(
    _SetExistingItemQuantity event,
    Emitter<DetailState> emit,
  ) {
    final idx = state.existingGoods.indexWhere(
      (g) => g.uniqueId == event.itemKey,
    );
    if (idx == -1) return;
    final item = state.existingGoods[idx];
    if (item.commet == 'cancelled' || item.commet == 'pending_offline') return;
    if (state.existingSyncingNames.contains(item.goods.name)) return;
    if (event.quantity == item.quantity) return;
    if (event.quantity < 1) return;

    _captureSnapshotIfNeeded(item);
    final updated = List<OrderItem>.from(state.existingGoods);
    updated[idx] = item.copyWith(quantity: event.quantity);
    emit(state.copyWith(
      existingGoods: updated,
      existingSyncingNames: {
        ...state.existingSyncingNames,
        item.goods.name,
      },
    ));

    _existingSyncTimers.remove(event.itemKey)?.cancel();
    add(DetailEvent.syncExistingItem(
      itemKey: event.itemKey,
      tableId: event.tableId,
    ));
  }

  Future<void> _deleteExistingByKey({
    required String itemKey,
    required String tableId,
    required Emitter<DetailState> emit,
  }) async {
    final idx = state.existingGoods.indexWhere((g) => g.uniqueId == itemKey);
    if (idx == -1) return;
    final item = state.existingGoods[idx];

    // Har qanday kutilayotgan +/- sinxronni bekor qilamiz — to'liq o'chirish
    // ustun.
    _existingSyncTimers.remove(itemKey)?.cancel();
    _existingSnapshots.remove(itemKey);

    // Optimistic remove
    final updated = List<OrderItem>.from(state.existingGoods)..removeAt(idx);
    emit(state.copyWith(existingGoods: updated));

    // Delete davomida shu nomdagi item disable (item allaqachon listdan
    // olib tashlangan, lekin agar refetch'da qaytib ko'rinsa ham clicklarni
    // bloklaymiz).
    final itemName = item.goods.name;
    emit(state.copyWith(
      existingSyncingNames: {...state.existingSyncingNames, itemName},
    ));

    final lineIds = _resolveLineIds(item);
    final dio = inject<DioClient>().dio;
    try {
      for (final id in lineIds) {
        try {
          await dio.post(ListAPI.orderItemCancel(id));
        } on DioException catch (e) {
          // 404 — line allaqachon yo'q (boshqa client bekor qilgan) — davom etamiz
          if (e.response?.statusCode != 404) rethrow;
        }
      }
    } catch (_) {
      // Toast'ni global Dio interceptor (dio_interceptor.dart) o'zi ko'rsatadi —
      // bu yerda takror chaqirmaymiz, aks holda 2 ta snackbar chiqib ketadi.
    } finally {
      if (!isClosed) {
        await _fetchBillOrdersInline(tableId, emit);
        if (!isClosed) {
          final next = Set<String>.from(state.existingSyncingNames)
            ..remove(itemName);
          emit(state.copyWith(existingSyncingNames: next));
        }
      }
    }
  }

  /// Snapshot — bu item bilan birinchi marta o'zaro ta'sirda qachon bo'lganda
  /// saqlanadi. Net delta sync vaqtida shu snapshot bilan solishtiriladi.
  ///
  /// Diqqat: `OrderItem.goods.id` mavjud (saqlangan) itemlar uchun line item
  /// id ni saqlaydi, mahsulot id ni emas. Shuning uchun goodId ni faqat
  /// `_existingLineInfo` map'idan olamiz (u /order-items/order/{id} dan
  /// to'planadi). Agar map bo'sh bo'lsa — snapshot.goodId bo'sh qoladi va sync
  /// vaqtida operatsiya bekor qilinadi (UI refetch orqali revert qilinadi).
  void _captureSnapshotIfNeeded(OrderItem item) {
    if (_existingSnapshots.containsKey(item.uniqueId)) return;
    final info = _existingLineInfo[item.goods.name];
    _existingSnapshots[item.uniqueId] = _ExistingSnapshot(
      goodId: info?.goodId ?? '',
      comment: item.comment,
      originalQty: item.quantity,
      originalLineIds:
          info != null ? List<String>.from(info.lineIds) : <String>[],
    );
  }

  void _scheduleExistingSync(String itemKey, String tableId) {
    _existingSyncTimers.remove(itemKey)?.cancel();
    _existingSyncTimers[itemKey] = Timer(_existingSyncDebounce, () {
      if (isClosed) return;
      add(DetailEvent.syncExistingItem(
        itemKey: itemKey,
        tableId: tableId,
      ));
    });
  }

  Future<void> _onSyncExistingItem(
    _SyncExistingItem event,
    Emitter<DetailState> emit,
  ) async {
    final snapshot = _existingSnapshots.remove(event.itemKey);
    _existingSyncTimers.remove(event.itemKey)?.cancel();

    // Sync paytida UI'da +/-/X disable bo'lishi uchun nomni topamiz. Disable
    // flag allaqachon increment/decrement handler'da set qilingan — bu yerda
    // try/finally bilan TOZALAB chiqamiz (har qanday early return holatda
    // ham flag yopiq qolib ketmasligi uchun).
    String? itemName;
    for (final g in state.existingGoods) {
      if (g.uniqueId == event.itemKey) {
        itemName = g.goods.name;
        break;
      }
    }

    try {
      if (snapshot == null) return;
      if (state.activeOrderId == null || state.activeOrderId!.isEmpty) {
        await _fetchBillOrdersInline(event.tableId, emit);
        return;
      }

      OrderItem? current;
      for (final g in state.existingGoods) {
        if (g.uniqueId == event.itemKey) {
          current = g;
          break;
        }
      }
      final desiredQty = current?.quantity ?? 0;
      final delta = desiredQty - snapshot.originalQty;
      if (delta == 0) {
        await _fetchBillOrdersInline(event.tableId, emit);
        return;
      }

      if (snapshot.goodId.isEmpty) {
        // /order-items/order/{id} hali yuklanmagan yoki bo'sh — to'g'ri sync
        // qila olmaymiz. Refetch orqali UI'ni revert qilamiz.
        if (navigatorKey.currentContext != null) {
          showErrorMessage(
            navigatorKey.currentContext!,
            'Ma\'lumot yuklanmagan. Yana urinib ko\'ring.',
          );
        }
        await _fetchBillOrdersInline(event.tableId, emit);
        return;
      }

      final dio = inject<DioClient>().dio;
      try {
        if (delta > 0) {
          // Plus: yangi line item qo'shamiz
          await dio.post(
            ListAPI.orderItemsCreate,
            data: {
              'order_id': state.activeOrderId,
              'items': [
                {
                  'good_id': snapshot.goodId,
                  'quantity': delta,
                  'comment': snapshot.comment,
                },
              ],
            },
          );
        } else {
          // Minus: barcha original line'larni bekor qilamiz, qolgan qty bo'lsa
          // bitta yangi line yaratamiz. Backend bitta line'ni bo'lish API
          // qilmaydi — shu yo'l yagona to'g'ri ish.
          for (final id in snapshot.originalLineIds) {
            try {
              await dio.post(ListAPI.orderItemCancel(id));
            } on DioException catch (e) {
              if (e.response?.statusCode != 404) rethrow;
            }
          }
          if (desiredQty > 0) {
            await dio.post(
              ListAPI.orderItemsCreate,
              data: {
                'order_id': state.activeOrderId,
                'items': [
                  {
                    'good_id': snapshot.goodId,
                    'quantity': desiredQty,
                    'comment': snapshot.comment,
                  },
                ],
              },
            );
          }
        }
      } catch (_) {
        // Toast global Dio interceptor (dio_interceptor.dart) tomonidan
        // ko'rsatiladi — bu yerda takror chaqirmaymiz.
      }

      if (!isClosed) {
        await _fetchBillOrdersInline(event.tableId, emit);
      }
    } finally {
      if (itemName != null && !isClosed) {
        final next = Set<String>.from(state.existingSyncingNames)
          ..remove(itemName);
        emit(state.copyWith(existingSyncingNames: next));
      }
    }
  }

  /// `_onFetchBillOrders` ni shu yerdan to'g'ridan-to'g'ri (`emit` bilan)
  /// chaqirish — refetch tugaguncha kutib turish va undan keyin sync flag'ini
  /// tozalash uchun zarur. `add()` orqali yuborilsa kuta olmaymiz.
  Future<void> _fetchBillOrdersInline(
    String tableId,
    Emitter<DetailState> emit,
  ) async {
    await _onFetchBillOrders(
      _FetchBillOrders(billId: tableId, force: true),
      emit,
    );
  }

  /// Item uchun underlying server line id'larini topadi. Avval
  /// `_existingLineInfo` map'iga (bills+order-items dan to'plangan), agar
  /// topilmasa — `OrderItem.uniqueId` ni o'zini single id deb hisoblaymiz.
  List<String> _resolveLineIds(OrderItem item) {
    final info = _existingLineInfo[item.goods.name];
    if (info != null && info.lineIds.isNotEmpty) {
      return List<String>.from(info.lineIds);
    }
    return item.uniqueId.isNotEmpty ? <String>[item.uniqueId] : <String>[];
  }

  Future<void> _onSetSelectedCategoryId(
    _SetSelectedCategoryId event,
    Emitter<DetailState> emit,
  ) async {
    emit(state.copyWith(selectedCategoryId: event.id));

    // Cache-first: darhol ko'rsat
    final allCached = _cache.getGoods();
    if (allCached.isNotEmpty) {
      final filtered = allCached
          .map((e) => GoodsModel.fromJson(e))
          .where((g) => event.id == 'all' || g.categoryId == event.id)
          .toList();
      emit(state.copyWith(status: Status.SUCCESS, goods: filtered));
    } else {
      emit(state.copyWith(status: Status.LOADING));
    }

    // Throttle: kassir tez-tez kategoriyani bosganda serverga burst ketmasin.
    // Cache da goodlar bo'lsa — 10s ichida bir xil kategoriya takrorlanmaydi.
    if (allCached.isNotEmpty &&
        _lastCategoryFetchId == event.id &&
        _lastCategoryFetchAt != null &&
        DateTime.now().difference(_lastCategoryFetchAt!) <
            _categoryFetchThrottle) {
      return;
    }
    _lastCategoryFetchId = event.id;
    _lastCategoryFetchAt = DateTime.now();

    // Orqa fonda network dan yangilanadi
    final result = await _getGoodsByCategoryIdUseCase(event.id);
    if (isClosed) return;
    result.fold(
      (failure) {
        if (allCached.isEmpty && !isClosed) {
          emit(state.copyWith(status: Status.ERROR, failure: failure));
        }
      },
      (goods) {
        if (isClosed) return;
        // "all" kategoriyasi kelganda cache yangilanadi
        if (event.id == 'all') {
          _cache.saveGoods(goods.map((g) => g.toJson()).toList());
        }
        emit(state.copyWith(status: Status.SUCCESS, goods: goods));
      },
    );
  }

  void _onAddFoodAdditional(
    _AddFoodAdditional event,
    Emitter<DetailState> emit,
  ) {
    final id = state.selectedGoods.indexWhere(
      (value) => value.uniqueId == event.orderId,
    );
    if (id != -1) {
      List<OrderItem> orders = List.from(state.selectedGoods);
      orders[id] = orders[id].copyWith(
        goods: orders[id].goods.copyWith(additionals: event.additionals),
        comment: event.comment,
      );
      emit(state.copyWith(selectedGoods: orders));
    }
  }

  void _onSelectGood(_SelectGood event, Emitter<DetailState> emit) {
    final selectedGoods = List<OrderItem>.from(state.selectedGoods);
    final index = selectedGoods.indexWhere(
      (item) => item.goods.id == event.good.id,
    );

    if (index != -1) {
      selectedGoods[index] = selectedGoods[index].copyWith(
        quantity: selectedGoods[index].quantity + 1,
      );
    } else {
      selectedGoods.add(
        OrderItem(goods: event.good, uniqueId: UniqueKey().toString()),
      );
    }
    emit(state.copyWith(selectedGoods: selectedGoods));
  }

  void _onIncrementQuantity(
    _IncrementQuantity event,
    Emitter<DetailState> emit,
  ) {
    final selectedGoods = List<OrderItem>.from(state.selectedGoods);
    final index = selectedGoods.indexWhere(
      (item) => item.goods.id == event.goodsId,
    );

    if (index != -1) {
      selectedGoods[index] = selectedGoods[index].copyWith(
        quantity: selectedGoods[index].quantity + 1,
      );
      emit(state.copyWith(selectedGoods: selectedGoods));
    }
  }

  void _onDecrementQuantity(
    _DecrementQuantity event,
    Emitter<DetailState> emit,
  ) {
    final selectedGoods = List<OrderItem>.from(state.selectedGoods);
    final index = selectedGoods.indexWhere(
      (item) => item.goods.id == event.goodsId,
    );

    if (index != -1) {
      if (selectedGoods[index].quantity > 1) {
        selectedGoods[index] = selectedGoods[index].copyWith(
          quantity: selectedGoods[index].quantity - 1,
        );
      } else {
        selectedGoods.removeAt(index);
      }
      emit(state.copyWith(selectedGoods: selectedGoods));
    }
  }

  void _onClearGoods(_ClearGoods event, Emitter<DetailState> emit) {
    emit(state.copyWith(selectedGoods: []));
  }

  Future<void> _onSearchTextChanged(
    _SearchTextChanged event,
    Emitter<DetailState> emit,
  ) async {
    if (event.text.isEmpty) {
      if (state.selectedCategoryId != null && !isClosed) {
        add(DetailEvent.setSelectedCategoryId(id: state.selectedCategoryId!));
      }
      return;
    }
    emit(state.copyWith(status: Status.LOADING, selectedCategoryId: "all"));
    final result = await _getGoodsWithNameUseCase(event.text);
    if (isClosed) return;
    result.fold(
      (failure) {
        if (!isClosed) {
          emit(state.copyWith(status: Status.ERROR, failure: failure));
        }
      },
      (goods) {
        if (!isClosed) {
          emit(state.copyWith(status: Status.SUCCESS, goods: goods));
        }
      },
    );
  }

  SaveOrderEntity? saveOrder(CafeTableModel cafeTable, int guestCount) {
    if (state.selectedGoods.isNotEmpty) {
      return SaveOrderModel(
        cafeTable: cafeTable,
        createOrderRequest: CreateOrderRequestModel(
          tableId: cafeTable.id,
          comment: "Very good",
          guestCount: guestCount,
          foods: state.selectedGoods,
          status: OrderStatus.open,
          tableStatus: TableStatus.busy,
        ),
      );
    }
    return null;
  }

  @override
  Future<void> close() {
    for (final t in _existingSyncTimers.values) {
      t.cancel();
    }
    _existingSyncTimers.clear();
    _existingSnapshots.clear();
    _existingLineInfo.clear();
    state.textController?.dispose();
    return super.close();
  }

  /// Ikki vaqtdan eng erta bo'lganini qaytaradi (null-aware).
  /// Bir xil nomli itemlarni guruhlanganda eng birinchi "urilgan" vaqtni
  /// saqlash uchun ishlatiladi.
  DateTime? _earlier(DateTime? a, DateTime? b) {
    if (a == null) return b;
    if (b == null) return a;
    return a.isBefore(b) ? a : b;
  }
}

/// Mavjud (saqlangan) itemning serverdagi aggregatlangan ko'rinishi.
/// `/api/v1/order-items/order/{id}` natijalaridan to'planadi.
class _ExistingLineInfo {
  final String goodId;
  final String comment;
  final List<String> lineIds; // underlying server line ids
  final int totalQuantity;

  _ExistingLineInfo({
    required this.goodId,
    required this.comment,
    required this.lineIds,
    required this.totalQuantity,
  });

  _ExistingLineInfo copyWith({
    String? goodId,
    String? comment,
    List<String>? lineIds,
    int? totalQuantity,
  }) =>
      _ExistingLineInfo(
        goodId: goodId ?? this.goodId,
        comment: comment ?? this.comment,
        lineIds: lineIds ?? this.lineIds,
        totalQuantity: totalQuantity ?? this.totalQuantity,
      );
}

/// Foydalanuvchi +/- bosgan paytdagi server snapshot. Debounce tugagach,
/// joriy UI qty bilan solishtirib backend sinxron qilinadi.
class _ExistingSnapshot {
  final String goodId;
  final String comment;
  final int originalQty;
  final List<String> originalLineIds;

  _ExistingSnapshot({
    required this.goodId,
    required this.comment,
    required this.originalQty,
    required this.originalLineIds,
  });
}
