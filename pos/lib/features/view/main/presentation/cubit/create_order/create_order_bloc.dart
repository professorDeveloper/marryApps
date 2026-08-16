import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:mary_ai_pos/core/api/api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/error/failure.dart';
import 'package:mary_ai_pos/core/routes/app_routes.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/connectivity/connectivity_cubit.dart';
import 'package:mary_ai_pos/core/services/lan/lan_server_service.dart';
import 'package:mary_ai_pos/core/services/lan_hub/lan_hub_service.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/services/printing/kitchen_print_queue.dart';
import 'package:mary_ai_pos/core/utils/helper/helper_widget.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/create_order/create_order_request_model.dart';
import 'package:mary_ai_pos/core/utils/uuid_v4.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/create_order_usecase.dart';
import 'package:mary_ai_pos/features/view/main/domain/usecase/create_take_away_order_usecase.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';

part 'create_order_event.dart';
part 'create_order_state.dart';
part 'create_order_bloc.freezed.dart';

class CreateOrderBloc extends Bloc<CreateOrderEvent, CreateOrderState> {
  late final CreateOrderUsecase _createOrderUsecase;
  late final CreateTakeAwayOrderUsecase _createTakeAwayOrderUsecase;
  final ConnectivityCubit _connectivity;
  final LanHubService _lanHub;
  final DioClient _client;

  /// Offline buyurtmalar shu yerda yashaydi — eski `OfflineQueueService` da
  /// emas.
  ///
  /// Sabab: LAN server (ofitsiant planshetlari) faqat `LocalOrderStore` dan
  /// o'qiydi. Kassa offline ochgan chek navbatga tushganda planshetda o'sha
  /// stol **bo'sh** ko'rinardi va ofitsiant o'sha stolga ikkinchi buyurtma
  /// ochardi. Bitta ombor — bitta haqiqat.
  final LocalOrderStore _localOrders;

  /// Kassir online ochgan chekni lokal omborga qabul qilish uchun.
  final CacheService _cache;

  /// Planshetlarga stol band bo'lganini darhol aytish uchun.
  final LanServerService _lanServer;

  /// Oshxona cheki. Ilgari kassirning buyurtmasi oshxonaga umuman
  /// chiqmasdi — na online, na offline: `printKitchenReceipt` ning yagona
  /// chaqiruvchisi ofitsiant ekrani (`WaiterCubit`) edi. Kassa taomni
  /// buyurtmaga yozardi, oshxonada esa undan xabar yo'q edi.
  final KitchenPrintQueue _kitchenPrint;

  // Active order ID for busy tables — set via bindActiveOrder()
  String? _activeOrderId;

  void bindActiveOrder(String orderId) => _activeOrderId = orderId;

  CreateOrderBloc({
    required CreateOrderUsecase createOrderUsecase,
    required CreateTakeAwayOrderUsecase createTakeAwayOrderUsecase,
    required ConnectivityCubit connectivity,
    required LanHubService lanHub,
    required DioClient client,
    required LocalOrderStore localOrders,
    required CacheService cache,
    required LanServerService lanServer,
    required KitchenPrintQueue kitchenPrint,
  })  : _createOrderUsecase = createOrderUsecase,
        _createTakeAwayOrderUsecase = createTakeAwayOrderUsecase,
        _connectivity = connectivity,
        _lanHub = lanHub,
        _client = client,
        _localOrders = localOrders,
        _cache = cache,
        _lanServer = lanServer,
        _kitchenPrint = kitchenPrint,
        super(const CreateOrderState()) {
    on<_Started>(_started);
    on<_CreateOrder>(_createOrder);
  }

  void _createOrder(_CreateOrder event, emit) async {
    emit(state.copyWith(status: Status.LOADING));

    final createdAt = DateTime.now();
    // Qatorlar **bir marta** tayyorlanadi va hamma yo'lda o'shalar
    // ishlatiladi. Oshxona chekining takrorlanish himoyasi qator id'siga
    // tayanadi: online urinish qulab offline yo'lga o'tsa ham id o'zgarmasa
    // ikkinchi chek chiqmaydi.
    final lines =
        event.orders.map((o) => _localItem(o, createdAt)).toList();

    if (state.tableId.isEmpty) {
      // ── Takeaway — always requires online ──────────────────────
      final response = await _createTakeAwayOrderUsecase.call(
        CreateOrderRequestModel(
          orderType: "takeaway",
          foods: event.orders,
        ),
      );
      response.fold(
        (l) {
          showErrorMessage(
            navigatorKey.currentContext!,
            l.getLocalizedMessage(navigatorKey.currentContext!),
          );
          emit(state.copyWith(status: Status.ERROR, failure: l));
        },
        (r) {
          // Olib ketish taomi ham pishiriladi — oshxona chekisiz buyurtma
          // faqat kassir ekranida qolardi.
          _kitchenPrint.enqueue(
            orderId: r,
            tableId: '',
            guestCount: 0,
            openedAt: createdAt,
            orderType: 'takeaway',
            items: lines,
          );
          Navigator.pushNamed(
            navigatorKey.currentContext!,
            AppRoutes.paymentScreen,
            arguments: {"order_id": r},
          );
          emit(state.copyWith(status: Status.SUCCESS, success: true));
        },
      );
      return;
    }

    // ── Dine-in ────────────────────────────────────────────────
    if (!_connectivity.isOnline) {
      await _handleOfflineOrder(lines, createdAt, emit);
      return;
    }

    // Kalit qoida: agar `_activeOrderId` bog'langan bo'lsa — server'da
    // mavjud buyurtmaga item qo'shamiz (POST /api/v1/order-items).
    // `state.tableStatus` free bo'lsa ham shunday ishlaydi — UI holati
    // eskirgan bo'lsa ham 409 conflict yuz bermaydi.
    if (_activeOrderId != null) {
      try {
        await _client.post(
          ListAPI.orderItemsCreate,
          data: {
            'order_id': _activeOrderId,
            'items': event.orders
                .map((o) => {
                      'comment': o.comment,
                      'good_id': o.goods.id,
                      'quantity': o.quantity,
                    })
                .toList(),
          },
        );
        _lanHub.tableStatusChanged(state.tableId, TableStatus.busy.name);
        _kitchenPrint.enqueue(
          orderId: _activeOrderId!,
          tableId: state.tableId,
          guestCount: state.guestCount,
          openedAt: createdAt,
          items: lines,
        );
        emit(state.copyWith(status: Status.SUCCESS, success: true));
      } on DioException catch (e) {
        if (e.type == DioExceptionType.connectionError ||
            e.type == DioExceptionType.sendTimeout ||
            e.type == DioExceptionType.receiveTimeout) {
          await _handleOfflineOrder(lines, createdAt, emit);
          return;
        }
        showErrorMessage(
          navigatorKey.currentContext!,
          e.message ?? 'Xato yuz berdi',
        );
        emit(state.copyWith(status: Status.ERROR));
      }
      return;
    }

    // Qo'shimcha himoya: stol busy lekin orderId hali bog'lanmagan — POST
    // /orders qilmaymiz (409 oldini olish). Foydalanuvchi ekranni yangilab
    // qayta urinsin (fetchBillOrders activeOrderId ni yozib qo'yadi).
    if (state.tableStatus == TableStatus.busy) {
      showErrorMessage(
        navigatorKey.currentContext!,
        "Buyurtma ID topilmadi. Ekranni yangilab qayta urinib ko'ring.",
      );
      emit(state.copyWith(status: Status.ERROR));
      return;
    }

    // Id bir marta — mana shu buyurtma uchun — generatsiya qilinadi va
    // online urinishda ham, offline navbatda ham **o'sha** id ishlatiladi.
    // Aks holda: server buyurtmani yozib ulgurgan, javob esa yo'lda
    // yo'qolgan holatda `ConnectionFailure` kelardi, navbat yangi id bilan
    // qayta yuborardi va bitta buyurtma cloudda ikkita bo'lardi.
    final orderId = UuidV4.generate();

    final request = CreateOrderRequestModel(
      orderId: orderId,
      tableId: state.tableId,
      comment: "Very good",
      guestCount: state.guestCount,
      foods: event.orders,
      status: OrderStatus.open,
      tableStatus: state.tableStatus,
      orderType: "dine_in",
    );

    final response = await _createOrderUsecase.call(request);
    response.fold(
      (l) async {
        if (l is ConnectionFailure) {
          await _handleOfflineOrder(lines, createdAt, emit, orderId);
          return;
        }
        l.showErrorMsg();
        emit(state.copyWith(status: Status.ERROR, failure: l));
      },
      (r) {
        _lanHub.tableStatusChanged(state.tableId, TableStatus.busy.name);
        _kitchenPrint.enqueue(
          orderId: orderId,
          tableId: state.tableId,
          guestCount: state.guestCount,
          openedAt: createdAt,
          items: lines,
        );
        emit(state.copyWith(status: Status.SUCCESS, success: r));
      },
    );
  }

  /// [orderId] — online urinish qilingan bo'lsa **o'sha** id berilishi shart,
  /// aks holda server yozib ulgurgan buyurtma navbatdan ikkinchi marta
  /// boshqa id bilan tushadi. Online urinish bo'lmagan yo'llarda `null`.
  Future<void> _handleOfflineOrder(
    List<Map<String, dynamic>> items,
    DateTime createdAt,
    Emitter<CreateOrderState> emit, [
    String? orderId,
  ]) async {
    final tableId = state.tableId;

    // Stolning ochiq cheki. Lokalda topilmasa — kassir uni online ochgan
    // bo'lishi mumkin: keshdagi chekni lokal omborga qabul qilamiz. Aks holda
    // offline qo'shilgan taomlar **ikkinchi** buyurtmaga tushardi va kassir
    // faqat yarmini undirardi.
    //
    // "Bitta stolda bitta ochiq chek" — butun tizim shu qoidaga tayanadi
    // (`openOrderForTable`, LAN `/tables` bandligi, to'lov ekrani). Shuning
    // uchun ochiq chek topilsa `state.tableStatus` nima deyishidan qat'i
    // nazar qatorlar o'shanga qo'shiladi.
    var open = _localOrders.openOrderForTable(tableId);
    if (open == null) {
      final cached = _cache.getOrderDetail(tableId);
      final adopted =
          cached == null ? null : LocalOrder.fromCloudDetail(cached);
      if (adopted != null && adopted.status == 'open') {
        await _localOrders.upsert(adopted);
        open = adopted;
      }
    }

    LocalOrder? saved;
    if (open != null) {
      try {
        saved = await _localOrders.appendItems(open.id, items);
      } on StateError {
        // Chek shu orada yopilgan — pastda yangi buyurtma ochamiz.
        saved = null;
      }
    }

    if (saved == null) {
      saved = LocalOrder(
        id: orderId ?? UuidV4.generate(),
        tableId: tableId,
        guestCount: state.guestCount,
        orderType: 'dine_in',
        items: items,
        clientCreatedAt: createdAt,
      );
      await _localOrders.upsert(saved);
    }

    // Oshxona cheki internetdan mustaqil — printer LAN'da, port 9100.
    // Internet yo'qligi taomning pishmasligiga sabab bo'lmasligi kerak.
    _kitchenPrint.enqueue(
      orderId: saved.id,
      tableId: tableId,
      guestCount: saved.guestCount,
      openedAt: saved.clientCreatedAt,
      items: items,
    );

    // Optimistic: stol band deb belgilash.
    // `_lanHub` — boshqa POS terminallariga, `_lanServer` — ofitsiant
    // planshetlariga. Ikkalasi ikki xil tarmoq, ikkalasi ham kerak.
    _lanHub.tableStatusChanged(tableId, TableStatus.busy.name);
    _lanServer.notifyTableStatus(tableId, 'busy');
    emit(state.copyWith(status: Status.SUCCESS, success: true));
  }

  /// `OrderItem` → `LocalOrder` qatori.
  ///
  /// `category_id` **shu yerda** yoziladi: oshxona printeri aynan kategoriya
  /// bo'yicha tanlanadi va menyu keshi keyin yangilansa ham chek to'g'ri
  /// printerga borishi kerak. `price` ham saqlanadi — chek va to'lov summasi
  /// buyurtma berilgan paytdagi narxdan hisoblanadi, keyin o'zgargan narxdan
  /// emas.
  Map<String, dynamic> _localItem(OrderItem item, DateTime createdAt) {
    var categoryId = item.goods.categoryId;
    if (categoryId.isEmpty) {
      final cached = _cache.getGoods().firstWhere(
            (g) => g['id']?.toString() == item.goods.id,
            orElse: () => const <String, dynamic>{},
          );
      categoryId = cached['category_id']?.toString() ?? '';
    }
    return {
      'id': UuidV4.generate(),
      'good_id': item.goods.id,
      'name': item.goods.name,
      'quantity': item.quantity,
      'price': num.tryParse(item.goods.price) ?? 0,
      if (categoryId.isNotEmpty) 'category_id': categoryId,
      if (item.comment.isNotEmpty) 'comment': item.comment,
      'created_at': createdAt.toUtc().toIso8601String(),
    };
  }

  void _started(_Started event, emit) => emit(
        CreateOrderState(
          tableId: event.tableId ?? '',
          guestCount: event.guestCount,
          tableStatus: event.tableStatus,
        ),
      );
}
