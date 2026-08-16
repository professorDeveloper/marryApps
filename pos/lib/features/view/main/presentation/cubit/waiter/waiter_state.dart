part of 'waiter_cubit.dart';

enum WaiterPanelMode { none, createForm, billDetail, closeForm }

class WaiterState {
  final List<OpenOrderModel> openOrders;
  final String? selectedOrderId;
  final WaiterPanelMode panelMode;
  final bool isLoadingOrders;
  final bool isCreatingOrder;
  final bool isSendingItems;
  final bool isClosingOrder;
  final bool isLoadingStaff;
  final List<UserModel> staffWaiters;
  final String? errorMessage;
  final List<OrderLineItemModel> orderLineItems;
  final bool isLoadingOrderItems;
  final bool orderItemsEditMode;
  final String? cancellingOrderItemId;

  const WaiterState({
    this.openOrders = const [],
    this.selectedOrderId,
    this.panelMode = WaiterPanelMode.none,
    this.isLoadingOrders = false,
    this.isCreatingOrder = false,
    this.isSendingItems = false,
    this.isClosingOrder = false,
    this.isLoadingStaff = false,
    this.staffWaiters = const [],
    this.errorMessage,
    this.orderLineItems = const [],
    this.isLoadingOrderItems = false,
    this.orderItemsEditMode = false,
    this.cancellingOrderItemId,
  });

  OpenOrderModel? get selectedOrder =>
      openOrders.where((o) => o.id == selectedOrderId).firstOrNull;

  WaiterState copyWith({
    List<OpenOrderModel>? openOrders,
    Object? selectedOrderId = _sentinel,
    WaiterPanelMode? panelMode,
    bool? isLoadingOrders,
    bool? isCreatingOrder,
    bool? isSendingItems,
    bool? isClosingOrder,
    bool? isLoadingStaff,
    List<UserModel>? staffWaiters,
    Object? errorMessage = _sentinel,
    List<OrderLineItemModel>? orderLineItems,
    bool? isLoadingOrderItems,
    bool? orderItemsEditMode,
    Object? cancellingOrderItemId = _sentinel,
  }) {
    return WaiterState(
      openOrders: openOrders ?? this.openOrders,
      selectedOrderId: identical(selectedOrderId, _sentinel)
          ? this.selectedOrderId
          : selectedOrderId as String?,
      panelMode: panelMode ?? this.panelMode,
      isLoadingOrders: isLoadingOrders ?? this.isLoadingOrders,
      isCreatingOrder: isCreatingOrder ?? this.isCreatingOrder,
      isSendingItems: isSendingItems ?? this.isSendingItems,
      isClosingOrder: isClosingOrder ?? this.isClosingOrder,
      isLoadingStaff: isLoadingStaff ?? this.isLoadingStaff,
      staffWaiters: staffWaiters ?? this.staffWaiters,
      errorMessage: identical(errorMessage, _sentinel)
          ? this.errorMessage
          : errorMessage as String?,
      orderLineItems: orderLineItems ?? this.orderLineItems,
      isLoadingOrderItems: isLoadingOrderItems ?? this.isLoadingOrderItems,
      orderItemsEditMode: orderItemsEditMode ?? this.orderItemsEditMode,
      cancellingOrderItemId: identical(cancellingOrderItemId, _sentinel)
          ? this.cancellingOrderItemId
          : cancellingOrderItemId as String?,
    );
  }
}

const _sentinel = Object();
