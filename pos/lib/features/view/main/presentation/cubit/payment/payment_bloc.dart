import 'dart:async';
import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/payment_pay_request/payment_pay_request_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/archive_detail_entity.dart';
import 'package:mary_ai_pos/core/service/printer/printer_service.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/services/offline_queue/offline_queue_service.dart';
import 'package:mary_ai_pos/core/services/offline_queue/pending_operation.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/core/services/local/local_order_sync_service.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archive_detail/local_order_detail_mapper.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/di.dart' show inject;
import 'package:mary_ai_pos/features/view/main/data/models/archive_detail/archive_detail_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/order_food/order_food_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/create_payment_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_payment_detail_with_id_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/get_payment_detail_with_table_id_usecase.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';

part 'payment_event.dart';
part 'payment_state.dart';
part 'payment_bloc.freezed.dart';

class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  final GetPaymentDetailWithTableIdUsecase _getPaymentDetailWithTableIdUsecase;
  final CreatePaymentUsecase _createPaymentUsecase;
  final GetPaymentDetailWithIdUsecase _getPaymentDetailWithIdUsecase;
  final PrinterService _printerService;

  DateTime? _timerStartedAt;
  List<PauseInterval> _timerPauses = const [];
  int _timerTotalSec = 0;
  String? _timerPricePerHour;

  // Public read-only getters for UI (preview modal)
  DateTime? get timerStartedAt => _timerStartedAt;
  List<PauseInterval> get timerPauses => _timerPauses;
  int get timerTotalSec => _timerTotalSec;
  String? get timerPricePerHour => _timerPricePerHour;

  void setTimerInfo({
    DateTime? startedAt,
    List<PauseInterval> pauses = const [],
    int totalSec = 0,
    String? pricePerHour,
  }) {
    _timerStartedAt = startedAt;
    _timerPauses = pauses;
    _timerTotalSec = totalSec;
    _timerPricePerHour = pricePerHour;
  }

  PaymentBloc({
    required GetPaymentDetailWithTableIdUsecase getPaymentDetailWithTableIdUsecase,
    required CreatePaymentUsecase createPaymentUsecase,
    required GetPaymentDetailWithIdUsecase getPaymentDetailWithId,
    required PrinterService printerService,
  }) : _getPaymentDetailWithTableIdUsecase = getPaymentDetailWithTableIdUsecase,
       _createPaymentUsecase = createPaymentUsecase,
       _getPaymentDetailWithIdUsecase = getPaymentDetailWithId,
       _printerService = printerService,
       super(const PaymentState()) {
    on<_Started>(_onStarted);
    on<_GetDetail>(_onGetDetail);
    on<_UpdatePaymentType>(_onUpdatePaymentType);
    on<_UpdateEnterSum>(_onUpdateEnterSum);
    on<_Payment>(_payment);
    on<_DiscountType>(_updateDiscountType);
    on<_UpdateDiscountAmount>(_updateDiscountAmount);
    on<_UpdateHourPrice>(_updateHourPrice);
    on<_ItemTimestampsLoaded>(_onItemTimestampsLoaded);
  }

  void _onItemTimestampsLoaded(
    _ItemTimestampsLoaded event,
    Emitter<PaymentState> emit,
  ) {
    emit(state.copyWith(itemTimestamps: event.timestamps));
  }

  void _updateHourPrice(_UpdateHourPrice event, emit) {
    // enterSum ni ham yangilash — agar kassir hali o'zgartirmagan bo'lsa
    final detail = state.detail;
    final newHour = event.hourPrice.toInt();
    String? newEnterSum;
    if (detail != null) {
      final base = effectiveTotal(detail);
      final currentEntered = int.tryParse(state.enterSum) ?? 0;
      final oldExpected = base + state.hourPrice.toInt();
      if (currentEntered == 0 || currentEntered == oldExpected) {
        newEnterSum = (base + newHour).toString();
      }
    }
    emit(state.copyWith(
      hourPrice: event.hourPrice,
      enterSum: newEnterSum ?? state.enterSum,
    ));
  }

  void _updateDiscountAmount(_UpdateDiscountAmount event, emit) {
    final raw = event.amount;
    if (raw.startsWith('numpad:')) {
      final symbol = raw.substring(7);
      String current = state.discountAmount == '0' ? '' : state.discountAmount;
      if (symbol == '⌫') {
        current = current.isEmpty ? '' : current.substring(0, current.length - 1);
      } else if (symbol == '00') {
        if (current.isNotEmpty) current += '00';
      } else if (current.isEmpty && symbol == '0') {
        current = '';
      } else {
        current += symbol;
      }
      emit(state.copyWith(discountAmount: current.isEmpty ? '0' : current));
    } else {
      emit(state.copyWith(discountAmount: raw.isEmpty ? '0' : raw));
    }
  }

  void _updateDiscountType(_DiscountType event, emit) =>
      emit(state.copyWith(discountType: event.dicountType));

  void _payment(_Payment event, Emitter<PaymentState> emit) async {
    final enteredAmt = int.tryParse(state.enterSum) ?? 0;
    final effectiveTot = state.detail != null
        ? effectiveTotal(state.detail!) + state.hourPrice.toInt() + pendingOfflineExtra(state.tableId)
        : 1;
    final cashNeedsAmount = state.paymentType == PaymentType.cash && enteredAmt <= 0 && effectiveTot > 0;
    if (state.detail != null && !cashNeedsAmount) {
      emit(state.copyWith(status: Status.LOADING));

      // Buyurtma hali cloudda yo'q bo'lsa (ofitsiantdan LAN orqali kelgan,
      // hali sinxronlanmagan) — to'lovni yuborishdan oldin uni surib
      // yuboramiz. Aks holda `/orders/{id}/pay` mavjud bo'lmagan buyurtmaga
      // tushib 404 qaytaradi.
      if (!await _ensureOrderOnCloud()) {
        // Aloqa yo'q — to'lov navbatga tushadi, buyurtmaning o'zi ham
        // navbatda turibdi va ikkalasi tartib bilan yuboriladi.
        await _enqueuePayment();
        if (isClosed) return;
        _onPaymentSuccess();
        return;
      }

      // Total 0 bo'lsa — /pay emas /cancel
      if (effectiveTot <= 0) {
        try {
          await inject<DioClient>().dio.post(
            ListAPI.cancelOrder(state.detail!.id),
          );
          _onPaymentSuccess();
        } catch (e) {
          if (!isClosed) emit(state.copyWith(status: Status.ERROR));
          showErrorMessage(
            navigatorKey.currentContext!,
            e.toString(),
          );
        }
        return;
      }

      final response = await _createPaymentUsecase.call(
        PaymentPayRequestModel(
          orderId: state.detail!.id,
          // cashRegisterId: "a195f647-8cf0-4132-8464-fdaaa2d77a68",
          // cashierId: "4e25f6c1-68c0-43bd-bcb2-a130bde2e9e1",
          // Chegirmadan oldingi jami (discount_* alohida); naqd kiritilgan sum qayta emas.
          customPaidAmount: state.paymentType == PaymentType.cash
              ? enteredAmt
              : effectiveTotal(state.detail!) +
                    state.hourPrice.toInt() +
                    pendingOfflineExtra(state.tableId),
          discountAmount: state.discountType == DiscountType.money
              ? int.tryParse(state.discountAmount) != null
                    ? int.parse(state.discountAmount)
                    : 0
              : 0,
          discountPercent: state.discountType == DiscountType.percent
              ? int.tryParse(state.discountAmount) != null
                    ? int.parse(state.discountAmount)
                    : 0
              : 0,
          paymentType: state.paymentType,
        ),
      );
      response.fold(
        (l) async {
          if (l.isOffline) {
            // Karta/QR ham navbatga tushaveradi. Bu POS bank bilan
            // integratsiyalashmagan — `paymentType` shunchaki yorliq, kassir
            // kartani alohida bank terminalida o'tkazadi. Ishonch modeli
            // online va offline'da bir xil, shuning uchun kartani bloklash
            // xavfsizlik bermaydi, faqat aloqa yo'qolganda hisobni yopishga
            // to'sqinlik qiladi (bank terminalining o'z SIM aloqasi bor).
            await _enqueuePayment();
            if (isClosed) return;
            _onPaymentSuccess();
            return;
          }
          if (!isClosed) emit(state.copyWith(status: Status.ERROR));
          showErrorMessage(
            navigatorKey.currentContext!,
            l.getLocalizedMessage(navigatorKey.currentContext!),
          );
        },
        (r) => _onPaymentSuccess(),
      );
    }
  }

  void _onPaymentSuccess() {
    // DIQQAT: chek detali AYNAN shu yerda, lokal buyurtma yopilishidan
    // OLDIN hisoblanadi. `pendingOfflineGoods` `openOrderForTable` ga
    // tayanadi, quyidagi `setStatus(..., 'closed')` esa uni yopadi —
    // keyin chaqirilsa offline qatorlar chekdan tushib qolardi.
    final receiptDetail = state.detail != null
        ? detailForReceipt(state.detail!, state.tableId)
        : null;

    // Lokal buyurtmani yopamiz. Busiz `openOrderForTable` uni qaytaraverardi:
    // `MainCubit._overlayLocal` stolni qayta "band" qilib qo'yardi va chek
    // ekranida to'langan taomlar turaverardi. Yozuv o'chirilmaydi — hali
    // cloudga yetmagan bo'lsa sinxronizatsiya davom etadi (`pendingSync`
    // holatga emas, `syncState` ga qaraydi).
    // Yopish AYNAN to'langan buyurtma id'si bo'yicha bo'ladi, stol bo'yicha
    // qidiruv bilan emas. Ilgari shu yerda `openOrderForTable(tableId)`
    // chaqirilardi va u qaytargan narsa yopilardi: to'lov yo'lda ketayotganda
    // ofitsiant LAN orqali yangi davra yuborgan bo'lsa, `openOrderForTable`
    // **yangisini** qaytarardi va aynan o'sha yopilardi — pishirilgan taomlar
    // hech qanday hisobga tushmasdi, to'langan buyurtma esa ochiq qolardi.
    final store = inject<LocalOrderStore>();
    final paidId = state.detail?.id ?? '';
    if (paidId.isNotEmpty && store.getById(paidId) != null) {
      unawaited(store.setStatus(paidId, 'closed'));
    } else {
      // To'langan buyurtma lokal omborda yo'q (faqat cloudda tug'ilgan) —
      // eski xatti-harakat, lekin endi u faqat zaxira yo'l.
      final tableId = state.tableId;
      if (tableId != null) {
        final local = store.openOrderForTable(tableId);
        if (local != null) unawaited(store.setStatus(local.id, 'closed'));
      }
    }

    showSuccessMessage(
      navigatorKey.currentContext!,
      "Buyurtma muvafaqqiyatli to'landi",
    );
    final discPct = state.discountType == DiscountType.percent
        ? (int.tryParse(state.discountAmount) ?? 0).toDouble()
        : 0.0;
    final discAmt = state.discountType == DiscountType.money
        ? (int.tryParse(state.discountAmount) ?? 0).toDouble()
        : 0.0;
    _printerService.printCashierReceiptFromDetail(
      detail: receiptDetail ?? state.detail!,
      hourAmount: state.hourPrice,
      discountPercent: discPct,
      discountAmount: discAmt,
      timerStartedAt: _timerStartedAt,
      timerPauses: _timerPauses,
      timerTotalSec: _timerTotalSec,
      timerPricePerHour: _timerPricePerHour,
    );
    final mainCubit = navigatorKey.currentContext!.read<MainCubit>();
    if (state.tableId != null) {
      mainCubit.updateTableStatus(state.tableId!, TableStatus.free);
    }
    Navigator.pushNamedAndRemoveUntil(
      navigatorKey.currentContext!,
      AppRoutes.mainScreen,
      (value) => true,
    );
    // To'lovdan keyin backend holatini yangilaymiz — local status yangilandi,
    // lekin boshqa stollar yoki serverdagi o'zgarishlar eskirgan bo'lishi mumkin.
    mainCubit.refreshTables(force: true);
  }

  /// Lokal buyurtma cloudda borligiga ishonch hosil qiladi.
  ///
  /// `true` — cloudda bor (yoki umuman lokal buyurtma emas, ya'ni allaqachon
  /// serverniki). `false` — surib bo'lmadi, to'lov navbatga tushishi kerak.
  Future<bool> _ensureOrderOnCloud() async {
    final tableId = state.tableId;
    if (tableId == null) return true;

    final store = inject<LocalOrderStore>();
    final local = store.openOrderForTable(tableId);
    if (local == null || local.cloudCreated) return true;

    if (!inject<ConnectivityCubit>().isOnline) return false;

    await inject<LocalOrderSyncService>().drain();
    return store.getById(local.id)?.cloudCreated ?? false;
  }

  Future<void> _enqueuePayment() async {
    final offlineExtra = pendingOfflineExtra(state.tableId);
    final effectiveAmt =
        effectiveTotal(state.detail!) + state.hourPrice.toInt() + offlineExtra;
    final enteredAmt = int.tryParse(state.enterSum) ?? 0;
    final paidAmount =
        state.paymentType == PaymentType.cash ? enteredAmt : effectiveAmt;
    final payload = jsonEncode({
      'order_id': state.detail!.id,
      'customer_paid_amount': paidAmount.toString(),
      'payment_type': state.paymentType.name,
      if ((int.tryParse(state.discountAmount) ?? 0) > 0 &&
          state.discountType == DiscountType.money)
        'discount_amount': int.parse(state.discountAmount),
      if ((int.tryParse(state.discountAmount) ?? 0) > 0 &&
          state.discountType == DiscountType.percent)
        'discount_percent': int.parse(state.discountAmount),
      // Pul AYNAN HOZIR olindi, yuborilgan paytda emas. Busiz backend
      // `paid_at = COALESCE($12, NOW())` bo'yicha sinxronizatsiya vaqtini
      // yozadi (`bills_custom.go` PayOrderBill) — kechqurun olingan naqd
      // ertalabki smenaga tushib qoladi va hisobot buziladi.
      'paid_at': DateTime.now().toUtc().toIso8601String(),
    });
    await inject<OfflineQueueService>().enqueue(
      PendingOperation(
        id: OfflineQueueService.newId(),
        type: PendingOperationType.payOrder,
        payload: payload,
        tableId: state.tableId ?? state.detail!.tableId,
        createdAt: DateTime.now(),
      ),
    );
    showSuccessMessage(
      navigatorKey.currentContext!,
      "To'lov navbatga qo'shildi — internet kelganda yuboriladi",
    );
  }

  /// Cloudga hali yetmagan, offline qo'shilgan qatorlar.
  ///
  /// Ilgari bu mantiq faqat **summa** qaytarardi (`pendingOfflineExtra`) va
  /// qatorlarning o'zi hech qayerga chiqmasdi. Natijada kassir cheki
  /// `state.detail` dan chizilardi — unda bu taomlar yo'q edi — undiriladigan
  /// summaga esa qo'shilardi. Ya'ni mijozdan 150 000 olinib, chekda 120 000
  /// chiqardi va e'tiroz bo'lsa kassirning qo'lida hech narsa qolmasdi.
  ///
  /// Endi qatorlar yagona manba: `pendingOfflineExtra` ham, chek ham shundan
  /// hisoblanadi, ya'ni ikkalasi bir-biridan ajralib ketolmaydi.
  static List<OrderFoodModel> pendingOfflineGoods(String? tableId) {
    if (tableId == null) return const [];
    final queue = inject<OfflineQueueService>();
    final cachedGoods = inject<CacheService>().getGoods();
    final out = <OrderFoodModel>[];

    for (final op in queue.pending.where(
      (o) => o.tableId == tableId && o.type == PendingOperationType.addItems,
    )) {
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
          final price =
              double.tryParse(goodJson['price']?.toString() ?? '0') ?? 0.0;
          out.add(
            OrderFoodModel(
              id: item['id']?.toString() ?? goodId,
              name: (item['name'] as String?)?.isNotEmpty == true
                  ? item['name'] as String
                  : (goodJson['name'] as String? ?? goodId),
              quantity: qty,
              price: price.toInt(),
              comment: item['comment']?.toString() ?? '',
              status: 'pending',
            ),
          );
        }
      } catch (_) {}
    }

    // Ofitsiant qo'shgan, cloudga hali yetmagan qatorlar. Server javobida
    // ular yo'q, ya'ni ularsiz kassir kam pul olardi. Buyurtma cloudda
    // umuman bo'lmasa chek to'liq lokal chiziladi (`archiveDetailFromLocalOrder`)
    // va bu yerga kirmaydi — shuning uchun faqat `cloudCreated` bo'lganlar
    // hisoblanadi, aks holda o'sha qatorlar ikki marta sanalardi.
    final local = inject<LocalOrderStore>().openOrderForTable(tableId);
    if (local != null && local.cloudCreated) {
      for (final item in local.unsyncedItems) {
        final qty = (item['quantity'] as num?)?.toInt() ?? 0;
        if (qty <= 0) continue;
        final goodId = item['good_id']?.toString() ?? '';
        final goodJson = cachedGoods.firstWhere(
          (g) => g['id'] == goodId,
          orElse: () => <String, dynamic>{},
        );
        final price = item['price'] != null
            ? asNum(item['price'])
            : asNum(goodJson['price']);
        out.add(
          OrderFoodModel(
            id: item['id']?.toString() ?? goodId,
            name: (item['name'] as String?)?.isNotEmpty == true
                ? item['name'] as String
                : (goodJson['name'] as String? ?? goodId),
            quantity: qty,
            price: price.toInt(),
            comment: item['comment']?.toString() ?? '',
            status: 'pending',
          ),
        );
      }
    }

    return out;
  }

  static int pendingOfflineExtra(String? tableId) => pendingOfflineGoods(
        tableId,
      ).fold<int>(0, (sum, g) => sum + g.price * g.quantity);

  /// Chop etish uchun chek detali — offline qatorlar qo'shilgan.
  ///
  /// Chek quruvchisi jamini `detail.goods` dan **qayta hisoblaydi** va
  /// `grandTotal` ga umuman qaramaydi (`cashier_receipt_builder.dart:403`).
  /// Shuning uchun qatorlarni qo'shishning o'zi kifoya emas: xizmat haqi
  /// foiz sifatida qolsa, u kattalashgan summaga qayta qo'llanib chekdagi
  /// jami undirilgandan **oshib** ketardi.
  ///
  /// Buning oldini olish uchun xizmat haqi aniq raqamga aylantiriladi:
  /// `effectiveTotal(detail) - foodSum`. Shunda chekdagi jami
  /// (`foodSum + extra + service`) undiriladigan summa bilan
  /// (`effectiveTotal + extra`, `_payment` dagi hisob) aynan teng bo'ladi.
  static ArchiveDetailEntity detailForReceipt(
    ArchiveDetailEntity detail,
    String? tableId,
  ) {
    final extraGoods = pendingOfflineGoods(tableId);
    if (extraGoods.isEmpty) return detail;
    // Freezed `copyWith` faqat modelda bor; boshqa implementatsiya kelsa
    // chekni o'zgartirmasdan qoldiramiz (eski xatti-harakat).
    if (detail is! ArchiveDetailModel) return detail;

    final foodSum = detail.goods
        .where((g) => g.status != 'cancelled')
        .fold<double>(0, (s, g) => s + g.price * g.quantity);
    final service = effectiveTotal(detail) - foodSum;

    return detail.copyWith(
      goods: [...detail.goods, ...extraGoods],
      serviceAmount: service > 0.0001 ? service : 0.0,
      servicePercent: service > 0.0001 ? detail.servicePercent : 0.0,
    );
  }

  static int effectiveTotal(ArchiveDetailEntity detail) {
    final hasCancelled = detail.goods.any((g) => g.status == 'cancelled');
    if (!hasCancelled && detail.grandTotal > 0.01) {
      return detail.grandTotal.toInt();
    }
    final foodSum = detail.goods
        .where((g) => g.status != 'cancelled')
        .fold(0.0, (s, g) => s + g.price * g.quantity);
    final service = detail.serviceAmount > 0.01
        ? detail.serviceAmount
        : foodSum * detail.servicePercent / 100;
    return (foodSum + service).toInt();
  }

  Future<void> _onStarted(_Started event, emit) async {
    emit(
      PaymentState(
        tableId: event.tableId,
        orderId: event.orderId,
        textController: TextEditingController(),
        status: Status.LOADING,
        detailStatus: Status.LOADING,
      ),
    );
    add(const PaymentEvent.getDetail());
  }

  Future<void> _onGetDetail(
    _GetDetail event,
    Emitter<PaymentState> emit,
  ) async {
    final cache = inject<CacheService>();

    if (state.tableId != null) {
      // Ofitsiantdan LAN orqali kelgan yoki offline yaratilgan buyurtma —
      // cloud undan xabarsiz bo'lishi mumkin. Bu holda kesh ham, server ham
      // chekni bermaydi va kassir stolni yopa olmaydi.
      final local = inject<LocalOrderStore>().openOrderForTable(state.tableId!);
      if (local != null && !local.cloudCreated) {
        final localDetail = archiveDetailFromLocalOrder(local, cache: cache);
        final prefill =
            PaymentBloc.effectiveTotal(localDetail) + state.hourPrice.toInt();
        emit(state.copyWith(
          status: Status.SUCCESS,
          detailStatus: Status.SUCCESS,
          detail: localDetail,
          enterSum: (state.enterSum.isEmpty || state.enterSum == '0')
              ? prefill.toString()
              : state.enterSum,
          failure: null,
        ));
        return;
      }

      // Cache-first: avval saqlangan detalni ko'rsat
      final cached = cache.getOrderDetail(state.tableId!);
      if (cached != null) {
        final cachedDetail = ArchiveDetailModel.fromJson(cached);
        // Avvalgi sessiyada cache'lab qo'yilgan timestamplarni ham qo'llaymiz
        final cachedTs = cache.getItemTimestamps(cachedDetail.id);
        emit(state.copyWith(
          detailStatus: Status.SUCCESS,
          status: Status.SUCCESS,
          detail: cachedDetail,
          itemTimestamps: cachedTs,
          failure: null,
        ));
      } else {
        emit(state.copyWith(detailStatus: Status.LOADING, failure: null, detail: null));
      }

      if (!inject<ConnectivityCubit>().isOnline) return;

      final response = await _getPaymentDetailWithTableIdUsecase.call(state.tableId!);
      response.fold(
        (failure) {
          if (cached == null) {
            showErrorMessage(
              navigatorKey.currentContext!,
              failure.getLocalizedMessage(navigatorKey.currentContext!),
            );
            emit(state.copyWith(status: Status.ERROR, detailStatus: Status.ERROR, failure: failure));
          }
        },
        (detail) {
          cache.saveOrderDetail(state.tableId!, (detail as ArchiveDetailModel).toJson());
          // Dastlabki to'lov oynasida "Qabul qilingan" ni aniq summa bilan
          // avtomatik to'ldirib qo'yamiz (agar kassir hali hech nima kiritmagan bo'lsa).
          final prefill = PaymentBloc.effectiveTotal(detail) + state.hourPrice.toInt();
          final shouldPrefill =
              state.enterSum.isEmpty || state.enterSum == '0';
          emit(state.copyWith(
            status: Status.SUCCESS,
            detailStatus: Status.SUCCESS,
            detail: detail,
            enterSum: shouldPrefill ? prefill.toString() : state.enterSum,
            failure: null,
          ));
          // Item timestamps — bills javobida yo'q, /order-items/order/{id}
          // dan olib alohida fetch qilamiz (UI vaqtni ko'rsatishi uchun).
          if (detail.id.isNotEmpty) {
            _fetchItemTimestamps(detail.id);
          }
        },
      );
    } else if (state.orderId != null) {
      emit(state.copyWith(detailStatus: Status.LOADING, failure: null, detail: null));
      final response = await _getPaymentDetailWithIdUsecase.call(state.orderId!);
      response.fold(
        (failure) {
          showErrorMessage(
            navigatorKey.currentContext!,
            failure.getLocalizedMessage(navigatorKey.currentContext!),
          );
          emit(state.copyWith(status: Status.ERROR, detailStatus: Status.ERROR, failure: failure));
        },
        (detail) {
          final prefill = PaymentBloc.effectiveTotal(detail) + state.hourPrice.toInt();
          final shouldPrefill =
              state.enterSum.isEmpty || state.enterSum == '0';
          emit(state.copyWith(
            status: Status.SUCCESS,
            detailStatus: Status.SUCCESS,
            detail: detail,
            enterSum: shouldPrefill ? prefill.toString() : state.enterSum,
            failure: null,
          ));
          if (detail.id.isNotEmpty) {
            _fetchItemTimestamps(detail.id);
          }
        },
      );
    }
  }

  /// `/api/v1/order-items/order/{orderId}` orqali har bir itemning
  /// `created_at` vaqtini olib, `state.itemTimestamps` (name -> earliest)
  /// ga yozadi. Bills javobida bu maydon yo'q.
  Future<void> _fetchItemTimestamps(String orderId) async {
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
      final tsByName = <String, DateTime>{};
      for (final entry in list.whereType<Map>()) {
        final m = Map<String, dynamic>.from(entry);
        final name = (m['good_name'] ?? m['name'] ?? '').toString();
        if (name.isEmpty) continue;
        final rawDate = m['created_at'] ?? m['createdAt'];
        DateTime? created;
        if (rawDate is String && rawDate.isNotEmpty) {
          created = DateTime.tryParse(rawDate)?.toLocal();
        }
        if (created == null) continue;
        final existing = tsByName[name];
        if (existing == null || created.isBefore(existing)) {
          tsByName[name] = created;
        }
      }
      if (tsByName.isEmpty || isClosed) return;
      // Cache — offline'da ham ko'rinadi
      await inject<CacheService>().saveItemTimestamps(orderId, tsByName);
      // emit'ni BLoC pattern qoidasiga muvofiq event orqali yuboramiz
      add(PaymentEvent.itemTimestampsLoaded(timestamps: tsByName));
    } catch (_) {
      // Endpoint xatosi sukut bilan o'tib ketadi
    }
  }

  void _onUpdatePaymentType(
    _UpdatePaymentType event,
    Emitter<PaymentState> emit,
  ) => emit(state.copyWith(paymentType: event.paymentType));

  void _onUpdateEnterSum(_UpdateEnterSum event, Emitter<PaymentState> emit) {
    // "set:12345" — to'g'ridan-to'g'ri qiymat o'rnatish
    if (event.symbol.startsWith('set:')) {
      emit(state.copyWith(enterSum: event.symbol.substring(4)));
      return;
    }

    String newEnterSum = state.enterSum;
    if (event.symbol == "⌫") {
      if (newEnterSum.isNotEmpty) {
        newEnterSum = newEnterSum.substring(0, newEnterSum.length - 1);
      }
    } else {
      if (newEnterSum == "0" && event.symbol == "00") {
        newEnterSum = "0";
      } else if (newEnterSum == "0" && event.symbol != "0") {
        newEnterSum = event.symbol;
      } else {
        newEnterSum += event.symbol;
      }
    }
    emit(state.copyWith(enterSum: newEnterSum));
  }

  @override
  Future<void> close() {
    state.textController?.dispose();
    return super.close();
  }
}
