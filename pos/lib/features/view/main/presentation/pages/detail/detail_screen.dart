import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:keyboard_dismisser/keyboard_dismisser.dart';
import 'package:mary_ai_pos/core/design_system/pos_design_system.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/domain/entities/save_order_entity.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/detail/detail_bloc.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/table_timer/table_timer_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/detail_screen_mixin.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/order_actions_bar.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/order_side_bar_widget.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/produc_grid_widget.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/detail/widgets/top_bar_widget.dart';
import 'package:virtual_keyboard_multi_language/virtual_keyboard_multi_language.dart';

class DetailScreen extends StatefulWidget {
  const DetailScreen({super.key});

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> with DetailScreenMixin {
  late final args =
      ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>;
  late final CafeTableModel? cafeTable = args['table'];
  late final int guestCount = args['guest_count'] ?? 0;
  late final SaveOrderEntity? savedOrders = args['saved_orders'];

  late ValueNotifier<bool> showVirtualKeyboard = ValueNotifier<bool>(false);
  final TextEditingController controller = TextEditingController();

  // Hold blocs directly so _autoStartTimedOrder can call them without
  // needing a child BuildContext (MultiBlocProvider is a descendant)
  late final TableTimerCubit _timerCubit = inject<TableTimerCubit>();
  late DetailBloc _detailBloc;

  // Mutable: free → busy after timer auto-starts
  TableStatus tableStatus = TableStatus.none;
  bool _initDone = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initDone) return;
    _initDone = true;

    tableStatus = args['table_status'] as TableStatus;

    final hasSavedGoods =
        savedOrders != null && savedOrders!.createOrderRequest.foods.isNotEmpty;

    _detailBloc = inject<DetailBloc>()
      ..add(const DetailEvent.started())
      ..add(const DetailEvent.getCategories())
      ..add(
        DetailEvent.initSavedGoods(
          savedGoods: savedOrders?.createOrderRequest.foods ?? [],
        ),
      );

    if (tableStatus == TableStatus.busy &&
        cafeTable != null &&
        !hasSavedGoods) {
      _detailBloc.add(DetailEvent.fetchBillOrders(billId: cafeTable!.id));
    }

    final isTimeBased = cafeTable?.tableType?.toLowerCase() == 'time_based';
    if (isTimeBased && tableStatus == TableStatus.free) {
      WidgetsBinding.instance.addPostFrameCallback(
        (_) => _autoStartTimedOrder(),
      );
    }
  }

  @override
  void dispose() {
    _timerCubit.close();
    _detailBloc.close();
    showVirtualKeyboard.dispose();
    controller.dispose();
    super.dispose();
  }

  Future<void> _autoStartTimedOrder() async {
    if (!mounted || cafeTable == null) return;
    final orderId = await _timerCubit.createTimedOrderAndStart(
      tableId: cafeTable!.id,
      guestCount: guestCount,
    );
    if (!mounted) return;

    // orderId null bo'lsa ham — ehtimol server'da buyurtma yaratilgan
    // (response parsing yoki receiveTimeout bilan null qaytgan). Shu sabab
    // bill'ni force fetch qilamiz — DetailBloc activeOrderId ni javobdan
    // olib yozadi va UI to'g'ri ishlaydi. Aks holda foydalanuvchi stolga
    // qaytadan urinishda 409 oladi.
    if (orderId != null) {
      _detailBloc.add(DetailEvent.setActiveOrderId(orderId: orderId));
    }
    setState(() => tableStatus = TableStatus.busy);
    context.read<MainCubit>().updateTableStatus(
      cafeTable!.id,
      TableStatus.busy,
    );
    _detailBloc.add(
      DetailEvent.fetchBillOrders(billId: cafeTable!.id, force: true),
    );
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _detailBloc),
        BlocProvider.value(value: _timerCubit),
      ],
      child: KeyboardDismisser(
        child: BlocListener<DetailBloc, DetailState>(
          listenWhen: (prev, curr) =>
              prev.activeOrderId != curr.activeOrderId &&
              curr.activeOrderId != null &&
              !_timerCubit.state.shouldShow,
          listener: (context, state) {
            // `cafeTable.tableType == time_based` gate olib tashlandi —
            // time-based stol simple stolga transfer qilinganda ham order
            // muzlatilgan `final_amount`'ga ega bo'lishi mumkin va
            // bu UI ga tiklanishi kerak. Cubit 400/non-frozen javoblarda
            // jimgina o'tib ketadi (shouldShow=false).
            _timerCubit.fetchTimer(orderId: state.activeOrderId!);
          },
          child: Scaffold(
            backgroundColor: context.colors.bgSecondary,
            body: Stack(
              children: [
                GestureDetector(
                  onTap: () {
                    if (showVirtualKeyboard.value) {
                      showVirtualKeyboard.value = false;
                    }
                  },
                  child: Column(
                    children: [
                      TopBarWidget(
                        cafeTable: cafeTable,
                        showKeyboard: showVirtualKeyboard,
                        textEditingController: controller,
                        guestCount: guestCount,
                      ),
                      OrderActionsBar(
                        tableId: cafeTable?.id,
                        guestCount: guestCount,
                        tableStatus: tableStatus,
                        cafeTable: cafeTable,
                        onTableStatusChanged: (s) =>
                            setState(() => tableStatus = s),
                      ),
                      Expanded(
                        child: Builder(
                          builder: (context) {
                            // Compact (1024–1366): kichikroq sidebar — joy tejash
                            // Comfortable (1366+): kengroq, qulayroq item kartochkalari
                            final sidebarW = PosBreakpoints.pickThree<double>(
                              context,
                              compact: PosDimensions.cartPanelCompact, // 320
                              comfortable:
                                  PosDimensions.cartPanelComfortable, // 400
                              large: 440.0,
                            );
                            return Row(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const Expanded(child: ProductGridWidget()),
                                SizedBox(
                                  width: sidebarW,
                                  child: OrderSidebar(
                                    tableId: cafeTable?.id,
                                    cafeTable: cafeTable,
                                  ),
                                ),
                              ],
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                // Virtual keyboard overlay
                ValueListenableBuilder(
                  valueListenable: showVirtualKeyboard,
                  builder: (context, value, _) {
                    if (!value) return const SizedBox.shrink();
                    return Positioned(
                      bottom: 0,
                      left: 0,
                      right: 0,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: context.colors.bgSecondary,
                        ),
                        child: SafeArea(
                          child: VirtualKeyboard(
                            height: context.h * .3,
                            customLayoutKeys: VirtualKeyboardDefaultLayoutKeys([
                              VirtualKeyboardDefaultLayouts.English,
                            ]),
                            textColor: Colors.black,
                            fontSize: 24,
                            textController: controller,
                            type: VirtualKeyboardType.Alphanumeric,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
