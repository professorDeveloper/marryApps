import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/extension/list_extension.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/waiter/waiter_cubit.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class CreateBillForm extends StatefulWidget {
  const CreateBillForm({super.key});

  @override
  State<CreateBillForm> createState() => _CreateBillFormState();
}

class _CreateBillFormState extends State<CreateBillForm> {
  final _nameCtrl = TextEditingController();
  late final TextEditingController _phoneCtrl;
  late final MaskTextInputFormatter _phoneMask;
  HallModel? _selectedHall;
  CafeTableModel? _selectedTable;
  UserModel? _selectedWaiter;
  int _guestCount = 0;
  bool _showNumpad = false;

  @override
  void initState() {
    super.initState();
    _phoneMask = MaskTextInputFormatter(
      mask: '+998 (##) ### ## ##',
      filter: {'#': RegExp(r'[0-9]')},
    );
    _phoneCtrl = TextEditingController();
    final mainState = context.read<MainCubit>().state;
    if (mainState.halls != null && mainState.halls!.isNotEmpty) {
      _selectedHall = mainState.halls!.first;
      context.read<MainCubit>().setSelectedHallId(_selectedHall!.id);
    }
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<WaiterCubit>().loadStaffWaiters().then((_) {
        if (!mounted) return;
        final waiters = context.read<WaiterCubit>().state.staffWaiters;
        _applyDefaultWaiter(waiters);
      });
    });
  }

  void _applyDefaultWaiter(List<UserModel> waiters) {
    if (waiters.isEmpty) return;
    final self = context.read<UserBloc>().state.userMOdel;
    final pick = self != null
        ? waiters.firstWhereOrNull((w) => w.id == self.id)
        : null;
    setState(() => _selectedWaiter = pick ?? waiters.first);
  }

  /// Bir xil id bilan takroriy stollar (API) — Dropdown faqat bitta [value] qabul qiladi.
  List<CafeTableModel> _dedupeTablesById(List<CafeTableModel> raw) {
    final seen = <String>{};
    return raw.where((t) => seen.add(t.id)).toList();
  }

  /// Ochiq schyoti bor stollar — yangi schyot uchun tanlanmaydi.
  List<CafeTableModel> _availableTablesForNewOrder(
    List<CafeTableModel> rawTables,
    List<HallModel>? halls,
    List<OpenOrderModel> openOrders,
  ) {
    final deduped = _dedupeTablesById(rawTables);
    final busyIds = <String>{};
    final busyByHallNumber = <String, Set<int>>{};
    for (final o in openOrders) {
      if (o.isTerminalOrderStatus) continue;
      final tid = o.tableId?.trim();
      if (tid != null && tid.isNotEmpty) {
        busyIds.add(tid);
        continue;
      }
      final hn = o.hallName.trim();
      busyByHallNumber.putIfAbsent(hn, () => <int>{}).add(o.tableNumber);
    }

    String hallNameForTable(CafeTableModel t) {
      final h = halls?.firstWhereOrNull((x) => x.id == t.hallId);
      return (h?.name ?? '').trim();
    }

    return deduped.where((t) {
      if (busyIds.contains(t.id)) return false;
      final hName = hallNameForTable(t);
      final nums = busyByHallNumber[hName];
      if (nums != null && nums.contains(t.number)) return false;
      final emptyHallNums = busyByHallNumber[''];
      if (emptyHallNums != null &&
          hName.isEmpty &&
          emptyHallNums.contains(t.number)) {
        return false;
      }
      return true;
    }).toList();
  }

  /// Tanlangan stol joriy [tables] ro‘yxatidagi obyekt bilan moslashtiriladi
  /// (status yangilanganda copyWith tufayli [==] buzilmasligi uchun).
  CafeTableModel? _resolvedSelectedTable(List<CafeTableModel> tables) {
    final s = _selectedTable;
    if (s == null) return null;
    return tables.firstWhereOrNull((t) => t.id == s.id);
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _onNumpad(String key) {
    if (key == '.') return;
    setState(() {
      if (key == '←') {
        final u = _phoneMask.getUnmaskedText();
        if (u.isEmpty) return;
        final newU = u.substring(0, u.length - 1);
        final result = _phoneMask.updateMask(
          newValue: TextEditingValue(
            text: newU,
            selection: TextSelection.collapsed(offset: newU.length),
          ),
        );
        _phoneCtrl.value = result;
        return;
      }
      if (!RegExp(r'^\d$').hasMatch(key)) return;
      final u = _phoneMask.getUnmaskedText();
      if (u.length >= 9) return;
      final newU = u + key;
      final result = _phoneMask.updateMask(
        newValue: TextEditingValue(
          text: newU,
          selection: TextSelection.collapsed(offset: newU.length),
        ),
      );
      _phoneCtrl.value = result;
    });
  }

  void _save() {
    final hall = _selectedHall;
    final table = _selectedTable;
    if (hall == null || table == null) return;

    // `waiter_id` in POST /orders: from this dropdown (`GET /api/v1/users` → role waiter).
    context.read<WaiterCubit>().createOrder(
          tableId: table.id,
          hallName: hall.name,
          tableNumber: table.number,
          guestCount: _guestCount,
          name: _nameCtrl.text.trim().isEmpty ? null : _nameCtrl.text.trim(),
          waiterId: _selectedWaiter?.id,
        );
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Stack(
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Новый счет',
                      style: context.textStyles.semibold16.copyWith(
                        fontSize: 15,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => context.read<WaiterCubit>().closePanel(),
                    child: Icon(Icons.close,
                        size: 20, color: colors.textTertiary),
                  ),
                ],
              ),
            ),
            Divider(height: 1, color: colors.border),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _Label('Название счета'),
                    const SizedBox(height: 6),
                    _InputField(controller: _nameCtrl, hint: ''),
                    const SizedBox(height: 14),

                    // Зал + Стол
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _Label('Зал'),
                              const SizedBox(height: 6),
                              BlocBuilder<MainCubit, MainState>(
                                buildWhen: (p, c) => p.halls != c.halls,
                                builder: (context, state) {
                                  final halls = state.halls ?? [];
                                  return _DropdownField<HallModel>(
                                    value: _selectedHall,
                                    items: halls,
                                    labelOf: (h) => h.name,
                                    onChanged: (h) {
                                      setState(() {
                                        _selectedHall = h;
                                        _selectedTable = null;
                                      });
                                      if (h != null) {
                                        context
                                            .read<MainCubit>()
                                            .setSelectedHallId(h.id);
                                      }
                                    },
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _Label('Стол'),
                              const SizedBox(height: 6),
                              BlocBuilder<WaiterCubit, WaiterState>(
                                buildWhen: (p, c) => p.openOrders != c.openOrders,
                                builder: (context, wState) {
                                  return BlocBuilder<MainCubit, MainState>(
                                    buildWhen: (p, c) =>
                                        p.tables != c.tables ||
                                        p.status != c.status ||
                                        p.halls != c.halls,
                                    builder: (context, state) {
                                      final tables =
                                          _availableTablesForNewOrder(
                                        state.tables ?? [],
                                        state.halls,
                                        wState.openOrders,
                                      );
                                      final tableValue =
                                          _resolvedSelectedTable(tables);
                                      if (_selectedTable != tableValue) {
                                        WidgetsBinding.instance
                                            .addPostFrameCallback((_) {
                                          if (!mounted) return;
                                          final main = context
                                              .read<MainCubit>()
                                              .state;
                                          final waiter = context
                                              .read<WaiterCubit>()
                                              .state;
                                          final fresh =
                                              _availableTablesForNewOrder(
                                            main.tables ?? [],
                                            main.halls,
                                            waiter.openOrders,
                                          );
                                          final synced =
                                              _resolvedSelectedTable(fresh);
                                          if (_selectedTable != synced) {
                                            setState(
                                              () => _selectedTable = synced,
                                            );
                                          }
                                        });
                                      }
                                      return _DropdownField<CafeTableModel>(
                                        value: tableValue,
                                        items: tables,
                                        labelOf: (t) => '${t.number}',
                                        onChanged: (t) => setState(
                                          () => _selectedTable = t,
                                        ),
                                      );
                                    },
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Официант + Обслуживание
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const _Label('Официант'),
                              const SizedBox(height: 6),
                              BlocBuilder<WaiterCubit, WaiterState>(
                                buildWhen: (p, c) =>
                                    p.isLoadingStaff != c.isLoadingStaff ||
                                    p.staffWaiters != c.staffWaiters,
                                builder: (context, state) {
                                  if (state.isLoadingStaff) {
                                    return const SizedBox(
                                      height: 42,
                                      child: Center(
                                        child: SizedBox(
                                          width: 22,
                                          height: 22,
                                          child:
                                              CircularProgressIndicator.adaptive(
                                            strokeWidth: 2,
                                          ),
                                        ),
                                      ),
                                    );
                                  }
                                  if (state.staffWaiters.isEmpty) {
                                    return const _StaticField(text: '—');
                                  }
                                  return _DropdownField<UserModel>(
                                    value: _selectedWaiter,
                                    items: state.staffWaiters,
                                    labelOf: (u) => u.fullName.isNotEmpty
                                        ? u.fullName
                                        : u.username,
                                    onChanged: (v) => setState(
                                      () => _selectedWaiter = v,
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _Label('Обслуживание'),
                              SizedBox(height: 6),
                              _StaticFieldWithSuffix(text: '0', suffix: '%'),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Клиент
                    const _Label('Клиент'),
                    const SizedBox(height: 6),
                    _PhoneField(
                      phoneCtrl: _phoneCtrl,
                      phoneMask: _phoneMask,
                      showNumpad: _showNumpad,
                      onTap: () =>
                          setState(() => _showNumpad = !_showNumpad),
                    ),
                    const SizedBox(height: 14),

                    // Количество гостей
                    const _Label('Количество гостей'),
                    const SizedBox(height: 6),
                    _GuestCounter(
                      count: _guestCount,
                      onDecrement: () {
                        if (_guestCount > 0) setState(() => _guestCount--);
                      },
                      onIncrement: () => setState(() => _guestCount++),
                    ),
                  ],
                ),
              ),
            ),

            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colors.border)),
              ),
              child: BlocBuilder<WaiterCubit, WaiterState>(
                buildWhen: (p, c) =>
                    p.isCreatingOrder != c.isCreatingOrder,
                builder: (context, state) {
                  final canSave =
                      _selectedHall != null && _selectedTable != null;
                  return Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              context.read<WaiterCubit>().closePanel(),
                          child: Container(
                            height: 44,
                            decoration: BoxDecoration(
                              color: colors.bgSecondary,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: Text(
                                'Отмена',
                                style: context.textStyles.semibold14,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: GestureDetector(
                          onTap: (canSave && !state.isCreatingOrder)
                              ? _save
                              : null,
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            height: 44,
                            decoration: BoxDecoration(
                              color: canSave
                                  ? colors.textBrand
                                  : colors.buttonDisabledBg,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Center(
                              child: state.isCreatingOrder
                                  ? SizedBox(
                                      width: 20,
                                      height: 20,
                                      child:
                                          CircularProgressIndicator.adaptive(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation(
                                                colors.textOnBrand),
                                      ),
                                    )
                                  : Text(
                                      'Сохранить',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: canSave
                                            ? colors.textOnBrand
                                            : colors.textSecondary,
                                      ),
                                    ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),

        // Numpad overlay
        if (_showNumpad)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: _Numpad(
              onKey: _onNumpad,
              onDone: () => setState(() => _showNumpad = false),
            ),
          ),
      ],
    );
  }
}

// ─── Phone field ──────────────────────────────────────────────────────────────

class _PhoneField extends StatelessWidget {
  final TextEditingController phoneCtrl;
  final MaskTextInputFormatter phoneMask;
  final bool showNumpad;
  final VoidCallback onTap;

  const _PhoneField({
    required this.phoneCtrl,
    required this.phoneMask,
    required this.showNumpad,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final borderColor = showNumpad ? colors.borderBrand : colors.border;
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 42,
            child: TextField(
              controller: phoneCtrl,
              inputFormatters: [phoneMask],
              keyboardType: TextInputType.phone,
              onTap: onTap,
              style: TextStyle(fontSize: 13, color: colors.textDefault),
              decoration: InputDecoration(
                hintText: S.current.strPhoneMask,
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: colors.textSecondary,
                ),
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                filled: true,
                fillColor: colors.bgSecondary,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: borderColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: borderColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: colors.borderBrand),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Icon(Icons.person_outline, size: 18, color: colors.textSecondary),
      ],
    );
  }
}

// ─── Guest counter ────────────────────────────────────────────────────────────

class _GuestCounter extends StatelessWidget {
  final int count;
  final VoidCallback onDecrement;
  final VoidCallback onIncrement;

  const _GuestCounter({
    required this.count,
    required this.onDecrement,
    required this.onIncrement,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      children: [
        Expanded(
          child: Container(
            height: 42,
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(
              color: colors.bgSecondary,
              border: Border.all(color: colors.border),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '$count',
                style: context.textStyles.semibold14,
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        _CounterBtn(icon: Icons.remove, onTap: onDecrement),
        const SizedBox(width: 6),
        _CounterBtn(icon: Icons.add, onTap: onIncrement),
      ],
    );
  }
}

// ─── Numpad ───────────────────────────────────────────────────────────────────

class _Numpad extends StatelessWidget {
  final ValueChanged<String> onKey;
  final VoidCallback onDone;

  const _Numpad({required this.onKey, required this.onDone});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['.', '0', '←'],
    ];

    return Container(
      color: colors.bgDefault,
      child: Column(
        children: [
          Divider(height: 1, color: colors.border),
          ...keys.map(
            (row) => Row(
              children: row.map((key) {
                return Expanded(
                  child: GestureDetector(
                    onTap: () => onKey(key),
                    child: Container(
                      height: 56,
                      decoration: BoxDecoration(
                        border: Border(
                          right: BorderSide(color: colors.border),
                          bottom: BorderSide(color: colors.border),
                        ),
                      ),
                      child: Center(
                        child: key == '←'
                            ? Icon(
                                Icons.backspace_outlined,
                                size: 20,
                                color: colors.iconDefault,
                              )
                            : Text(
                                key,
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w500,
                                  color: colors.textDefault,
                                ),
                              ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          GestureDetector(
            onTap: onDone,
            child: Container(
              height: 52,
              color: colors.buttonBrand,
              child: Center(
                child: Text(
                  'Готово',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: colors.textOnBrand,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: 12,
        color: context.colors.textTertiary,
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  const _InputField({required this.controller, required this.hint});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return TextField(
      controller: controller,
      style: TextStyle(fontSize: 13, color: colors.textDefault),
      decoration: InputDecoration(
        hintText: hint,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        filled: true,
        fillColor: colors.bgSecondary,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colors.borderBrand),
        ),
      ),
    );
  }
}

class _StaticField extends StatelessWidget {
  final String text;
  const _StaticField({required this.text});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Text(
          text,
          style: TextStyle(fontSize: 13, color: colors.textSecondary),
        ),
      ),
    );
  }
}

class _StaticFieldWithSuffix extends StatelessWidget {
  final String text;
  final String suffix;
  const _StaticFieldWithSuffix({required this.text, required this.suffix});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text,
              style: TextStyle(fontSize: 13, color: colors.textDefault),
            ),
          ),
          Text(
            suffix,
            style: TextStyle(fontSize: 13, color: colors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _DropdownField<T> extends StatelessWidget {
  final T? value;
  final List<T> items;
  final String Function(T) labelOf;
  final ValueChanged<T?> onChanged;

  const _DropdownField({
    required this.value,
    required this.items,
    required this.labelOf,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        border: Border.all(color: colors.border),
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButton<T>(
        value: value,
        isExpanded: true,
        underline: const SizedBox(),
        icon: Icon(Icons.keyboard_arrow_down_rounded,
            size: 18, color: colors.textTertiary),
        items: items
            .map(
              (item) => DropdownMenuItem<T>(
                value: item,
                child: Text(
                  labelOf(item),
                  style: TextStyle(
                    fontSize: 13,
                    color: colors.textDefault,
                  ),
                ),
              ),
            )
            .toList(),
        onChanged: onChanged,
      ),
    );
  }
}

class _CounterBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _CounterBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 38,
        height: 42,
        decoration: BoxDecoration(
          color: colors.bgSecondary,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: colors.border),
        ),
        child: Icon(icon, size: 18, color: colors.iconDefault),
      ),
    );
  }
}
