import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:mary_ai_pos/core/api/api_error_overlay.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/utils/pos_units.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/auth/presentation/cubit/bloc/user_bloc.dart';
import 'package:mary_ai_pos/features/view/main/data/models/cafe_tables/cafe_tables_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/hall/hall_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/cubit/main/main_cubit.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/main/widgets/admin_floor_plan_canvas.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/widgets/section_shell.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class HallsTablesSection extends StatefulWidget {
  const HallsTablesSection({super.key});

  @override
  State<HallsTablesSection> createState() => _HallsTablesSectionState();
}

class _HallsTablesSectionState extends State<HallsTablesSection> {
  final DioClient _client = inject<DioClient>();

  bool _loading = true;
  String? _error;
  List<HallModel> _halls = const [];
  HallModel? _selectedHall;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _client.get(ListAPI.halls);
      final root = res.data;
      List<dynamic> data = const [];
      if (root is Map && root['data'] is List) data = root['data'] as List;
      if (!mounted) return;
      setState(() {
        _halls = data
            .map((e) => HallModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        _loading = false;
        // Keep _selectedHall in sync if it was updated/removed.
        if (_selectedHall != null) {
          final match =
              _halls.where((h) => h.id == _selectedHall!.id).cast<HallModel?>();
          _selectedHall = match.isNotEmpty ? match.first : null;
        }
      });
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = _readError(e) ?? S.current.strLoadError;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  String? _readError(DioException e) => userFriendlyDioError(e);

  Future<void> _openHallEditor({HallModel? existing}) async {
    final branchId =
        context.read<UserBloc>().state.userMOdel?.branchId ?? '';
    final saved = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _HallEditDialog(
        existing: existing,
        branchId: branchId,
        client: _client,
      ),
    );
    if (saved == true && mounted) {
      _load();
      try {
        await context.read<MainCubit>().getHalls();
      } catch (_) {}
    }
  }

  Future<void> _confirmDeleteHall(HallModel hall) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => _ConfirmDeleteDialog(
        title: S.current.strDeleteHall,
        message:
            '«${hall.name}» zalini o\'chirmoqchimisiz? Ichidagi stollar ham o\'chib ketishi mumkin.',
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _client.delete('${ListAPI.halls}/${hall.id}');
      if (!mounted) return;
      _load();
      try {
        // ignore: use_build_context_synchronously
        await context.read<MainCubit>().getHalls();
      } catch (_) {}
    } on DioException catch (e) {
      if (!mounted) return;
      showErrorMessage(context, _readError(e) ?? S.current.strDeleteError);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      switchInCurve: Curves.easeOutCubic,
      switchOutCurve: Curves.easeInCubic,
      transitionBuilder: (child, animation) {
        return FadeTransition(
          opacity: animation,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0.015, 0),
              end: Offset.zero,
            ).animate(animation),
            child: child,
          ),
        );
      },
      child: _selectedHall == null
          ? _buildHallsList()
          : _TablesDetailView(
              key: ValueKey('tables-${_selectedHall!.id}'),
              hall: _selectedHall!,
              client: _client,
              onBack: () => setState(() => _selectedHall = null),
            ),
    );
  }

  Widget _buildHallsList() {
    return SectionShell(
      key: const ValueKey('halls-list'),
      title: S.current.strHalls,
      subtitle: _halls.isEmpty
          ? S.current.strNoHallsYet
          : '${_halls.length} ta zal — har bir zalning ichida stollar sozlanadi',
      trailing: SectionPrimaryButton(
        icon: Icons.add_rounded,
        label: S.current.strAddNewHall,
        onPressed: () => _openHallEditor(),
      ),
      child: _buildListBody(),
    );
  }

  Widget _buildListBody() {
    final colors = context.colors;
    if (_loading) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: colors.systemError.withOpacity(0.10),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(Icons.error_outline,
                  size: 28, color: colors.systemError),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: 320,
              child: Text(
                _error!,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: colors.systemError,
                  fontFamily: 'Inter',
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SectionPrimaryButton(
              icon: Icons.refresh_rounded,
              label: S.current.strRetry,
              onPressed: _load,
            ),
          ],
        ),
      );
    }
    if (_halls.isEmpty) {
      return SectionEmptyState(
        icon: Icons.table_restaurant_outlined,
        title: S.current.strNoHallsYet,
        subtitle:
            'Birinchi zalni yarating. Keyin uning ichida stollar qo\'shasiz.',
        action: SectionPrimaryButton(
          icon: Icons.add_rounded,
          label: S.current.strAddFirstHall,
          onPressed: () => _openHallEditor(),
        ),
      );
    }
    return ListView.separated(
      padding: EdgeInsets.zero,
      itemCount: _halls.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _HallCard(
        hall: _halls[i],
        onOpen: () => setState(() => _selectedHall = _halls[i]),
        onEdit: () => _openHallEditor(existing: _halls[i]),
        onDelete: () => _confirmDeleteHall(_halls[i]),
      ),
    );
  }
}

class _HallCard extends StatefulWidget {
  final HallModel hall;
  final VoidCallback onOpen;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _HallCard({
    required this.hall,
    required this.onOpen,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  State<_HallCard> createState() => _HallCardState();
}

class _HallCardState extends State<_HallCard> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final hall = widget.hall;
    final w = hall.width.toInt();
    final h = hall.height.toInt();

    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(16),
          // Hover holatida faqat border ranglanadi — soya yoki fon o'zgarmaydi.
          border: Border.all(
            color: _hover ? colors.buttonBrand : colors.border,
            width: _hover ? 1.5 : 1,
          ),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: widget.onOpen,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: colors.buttonBrand.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(Icons.table_restaurant_rounded,
                        color: colors.buttonBrand, size: 22),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          hall.name,
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: colors.textDefault,
                            fontFamily: 'Inter',
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Icon(Icons.aspect_ratio_rounded,
                                size: 13, color: colors.textSecondary),
                            const SizedBox(width: 5),
                            Text(
                              '$w × $h px',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: colors.textSecondary,
                                fontFamily: 'Inter',
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      _GhostIconButton(
                        icon: Icons.edit_outlined,
                        tooltip: S.current.strEdit,
                        color: colors.buttonBrand,
                        onTap: widget.onEdit,
                      ),
                      const SizedBox(width: 8),
                      _GhostIconButton(
                        icon: Icons.delete_outline_rounded,
                        tooltip: S.current.strDelete,
                        color: colors.systemError,
                        onTap: widget.onDelete,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ───────────────────── Tables detail view ──────────────────────

class _TablesDetailView extends StatefulWidget {
  final HallModel hall;
  final DioClient client;
  final VoidCallback onBack;

  const _TablesDetailView({
    super.key,
    required this.hall,
    required this.client,
    required this.onBack,
  });

  @override
  State<_TablesDetailView> createState() => _TablesDetailViewState();
}

class _TablesDetailViewState extends State<_TablesDetailView> {
  bool _loading = true;
  String? _error;
  List<CafeTableModel> _tables = const [];
  String? _selectedTableId;

  /// Pending drag moves — tableId → new (posX, posY). PUT qilinmagan.
  final Map<String, Offset> _pendingMoves = {};
  bool _savingMoves = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await widget.client.get(
        '${ListAPI.cafeTablesByHallId}/${widget.hall.id}',
      );
      final root = res.data;
      List<dynamic> data = const [];
      if (root is Map && root['data'] is List) data = root['data'] as List;
      if (!mounted) return;
      final parsed = data
          .map((e) =>
              CafeTableModel.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList()
        ..sort((a, b) => a.number.compareTo(b.number));
      setState(() {
        _tables = parsed;
        _loading = false;
      });
      await _autoLayoutInvalid(parsed);
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = _readError(e) ?? S.current.strLoadError;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  String? _readError(DioException e) => userFriendlyDioError(e);

  Future<void> _autoLayoutInvalid(List<CafeTableModel> all) async {
    final hallW = widget.hall.width <= 0 ? 1000.0 : widget.hall.width;
    final hallH = widget.hall.height <= 0 ? 800.0 : widget.hall.height;
    const pad = 40.0;
    const gap = 40.0;

    final invalid = <CafeTableModel>[];
    final occupied = <Offset>[];
    for (final t in all) {
      if (t.posX <= 0 || t.posY <= 0) {
        invalid.add(t);
      } else {
        occupied.add(Offset(t.posX, t.posY));
      }
    }
    if (invalid.isEmpty) return;

    bool collides(double x, double y, double w, double h) {
      for (final t in all) {
        if (invalid.contains(t)) continue;
        final ox = t.posX, oy = t.posY;
        if (x < ox + t.width &&
            x + w > ox &&
            y < oy + t.height &&
            y + h > oy) {
          return true;
        }
      }
      return false;
    }

    for (final t in invalid) {
      double x = pad, y = pad;
      bool placed = false;
      while (y + t.height <= hallH - pad) {
        while (x + t.width <= hallW - pad) {
          if (!collides(x, y, t.width, t.height)) {
            placed = true;
            break;
          }
          x += gap;
        }
        if (placed) break;
        x = pad;
        y += gap;
      }
      if (!placed) {
        x = pad;
        y = pad;
      }
      await _moveTable(t, x.round(), y.round());
    }
  }

  int _nextNumber() {
    if (_tables.isEmpty) return 1;
    return _tables.map((t) => t.number).reduce((a, b) => a > b ? a : b) + 1;
  }

  Future<void> _openTableEditor({
    CafeTableModel? existing,
    int? prefillPosX,
    int? prefillPosY,
  }) async {
    final saved = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _TableEditDialog(
        existing: existing,
        hall: widget.hall,
        client: widget.client,
        suggestedNumber: _nextNumber(),
        prefillPosX: prefillPosX,
        prefillPosY: prefillPosY,
        siblings: _tables.where((t) => t.id != existing?.id).toList(),
        onRequestDelete: _confirmDeleteTable,
      ),
    );
    if (saved == true && mounted) {
      _load();
      try {
        await context.read<MainCubit>().refreshTables();
      } catch (_) {}
    }
  }

  Future<void> _moveTable(
      CafeTableModel t, int newPosX, int newPosY) async {
    // Optimistic update + PUT (auto-layout va drop-to-add oqimlari uchun).
    setState(() {
      _tables = _tables
          .map((x) => x.id == t.id
              ? x.copyWith(
                  posX: newPosX.toDouble(), posY: newPosY.toDouble())
              : x)
          .toList();
    });
    try {
      await widget.client.put(
        ListAPI.cafeTableById(t.id),
        data: _tablePutPayload(t, newPosX, newPosY),
      );
      try {
        if (!mounted) return;
        // ignore: use_build_context_synchronously
        await context.read<MainCubit>().refreshTables();
      } catch (_) {}
    } on DioException catch (e) {
      if (!mounted) return;
      showErrorMessage(
          context, _readError(e) ?? S.current.strSavePositionError);
      _load();
    }
  }

  Map<String, dynamic> _tablePutPayload(
      CafeTableModel t, int newPosX, int newPosY) {
    return {
      'hall_id': widget.hall.id,
      'number': t.number,
      'capacity': t.capacity,
      'status': _statusToApi(t.status),
      'shape': _shapeToApi(
          t.shape == TableShape.rectangle ? TableShape.square : t.shape),
      'table_type': t.tableType ?? 'simple',
      'pos_x': newPosX,
      'pos_y': newPosY,
      'width': t.width.toInt(),
      'height': t.height.toInt(),
      'rotation': t.rotation.toInt(),
    };
  }

  /// Drag natijasini faqat lokal state va pending ro'yxatga yozadi.
  void _stageMove(CafeTableModel t, int newPosX, int newPosY) {
    setState(() {
      _tables = _tables
          .map((x) => x.id == t.id
              ? x.copyWith(
                  posX: newPosX.toDouble(), posY: newPosY.toDouble())
              : x)
          .toList();
      _pendingMoves[t.id] =
          Offset(newPosX.toDouble(), newPosY.toDouble());
    });
  }

  Future<void> _saveStagedMoves() async {
    if (_pendingMoves.isEmpty || _savingMoves) return;
    setState(() => _savingMoves = true);

    final entries = _pendingMoves.entries.toList();
    int failCount = 0;

    for (final entry in entries) {
      final t = _tables.firstWhere(
        (x) => x.id == entry.key,
        orElse: () => _tables.first,
      );
      if (t.id != entry.key) {
        failCount++;
        continue;
      }
      try {
        await widget.client.put(
          ListAPI.cafeTableById(t.id),
          data: _tablePutPayload(
              t, entry.value.dx.round(), entry.value.dy.round()),
        );
      } on DioException {
        failCount++;
      }
    }

    if (!mounted) return;
    if (failCount > 0) {
      showErrorMessage(context, S.current.strTablesNotSavedCount(failCount));
    } else {
      showSuccessMessage(context, S.current.strPositionsSaved, duration: 2);
    }

    setState(() {
      _savingMoves = false;
      _pendingMoves.clear();
    });

    try {
      if (!mounted) return;
      // ignore: use_build_context_synchronously
      await context.read<MainCubit>().refreshTables();
    } catch (_) {}

    if (failCount > 0 && mounted) _load();
  }

  void _discardStagedMoves() {
    if (_pendingMoves.isEmpty) return;
    setState(() {
      _pendingMoves.clear();
    });
    _load();
  }

  String _shapeToApi(TableShape s) {
    switch (s) {
      case TableShape.circle:
        return 'circle';
      case TableShape.square:
      case TableShape.rectangle:
        return 'square';
    }
  }

  String _statusToApi(TableStatus s) {
    switch (s) {
      case TableStatus.free:
        return 'free';
      case TableStatus.busy:
        return 'busy';
      case TableStatus.away:
        return 'away';
      case TableStatus.none:
        return 'none';
    }
  }

  Future<void> _confirmDeleteTable(CafeTableModel t) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => _ConfirmDeleteDialog(
        title: S.current.strDeleteTable,
        message: 'Stol №${t.number} o\'chiriladi. Buni qaytarib bo\'lmaydi.',
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await widget.client.delete(ListAPI.cafeTableById(t.id));
      if (!mounted) return;
      _load();
      try {
        // ignore: use_build_context_synchronously
        await context.read<MainCubit>().refreshTables();
      } catch (_) {}
    } on DioException catch (e) {
      if (!mounted) return;
      showErrorMessage(context, _readError(e) ?? S.current.strDeleteError);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
      padding: const EdgeInsets.fromLTRB(32, 24, 32, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _DetailHeader(
            hall: widget.hall,
            onBack: widget.onBack,
            onAdd: () => _openTableEditor(),
          ),
          const SizedBox(height: 18),
          _StatsRow(
            total: _tables.length,
            free: _tables.where((t) => t.status == TableStatus.free).length,
            busy: _tables.where((t) => t.status == TableStatus.busy).length,
            capacity:
                _tables.fold<int>(0, (sum, t) => sum + t.capacity),
          ),
          const SizedBox(height: 18),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: colors.bgSecondary,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.border),
              ),
              padding: const EdgeInsets.all(16),
              child: _buildBody(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    final colors = context.colors;
    if (_loading) {
      return const Center(child: CircularProgressIndicator.adaptive());
    }
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.error_outline,
                size: 36, color: colors.systemError),
            const SizedBox(height: 10),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: colors.systemError,
                fontFamily: 'Inter',
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 12),
            SectionPrimaryButton(
              icon: Icons.refresh_rounded,
              label: S.current.strRetry,
              onPressed: _load,
            ),
          ],
        ),
      );
    }
    if (_tables.isEmpty) {
      return SectionEmptyState(
        icon: Icons.deck_outlined,
        title: S.current.strNoTablesInHall,
        subtitle:
            'Stollarni qo\'shib, sig\'im va turini sozlang. Pozitsiya admin floor-plan ekranida sudrab qo\'yiladi.',
        action: SectionPrimaryButton(
          icon: Icons.add_rounded,
          label: S.current.strAddFirstTable,
          onPressed: () => _openTableEditor(),
        ),
      );
    }
    final tooSmall = widget.hall.width < minReasonableHallPx ||
        widget.hall.height < minReasonableHallPx;
    return Column(
      children: [
        if (tooSmall) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: colors.systemError.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.systemError.withOpacity(0.35)),
            ),
            child: Row(
              children: [
                Icon(Icons.warning_amber_rounded,
                    size: 18, color: colors.systemError),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Zal o\'lchami juda kichik (${formatMeters(pxToMeters(widget.hall.width))} × ${formatMeters(pxToMeters(widget.hall.height))} m). '
                    'Zallar ro\'yxatidan tahrirlab o\'lchamni to\'g\'rilang (masalan 8 × 6 m).',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: colors.systemError,
                      fontFamily: 'Inter',
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
        ],
        if (_pendingMoves.isNotEmpty) ...[
          _PendingMovesBar(
            count: _pendingMoves.length,
            saving: _savingMoves,
            onSave: _saveStagedMoves,
            onCancel: _discardStagedMoves,
          ),
          const SizedBox(height: 10),
        ],
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: colors.bgDefault,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.border),
            ),
            clipBehavior: Clip.antiAlias,
            child: AdminFloorPlanCanvas(
              tables: _tables,
              hall: widget.hall,
              isEditMode: true,
              selectedTableId: _selectedTableId,
              onTableSelected: (t) {
                setState(() => _selectedTableId = t.id);
                _openTableEditor(existing: t);
              },
              onTableMoved: (id, x, y) {
                final match = _tables.where((e) => e.id == id);
                if (match.isEmpty) return;
                _stageMove(match.first, x.round(), y.round());
              },
            ),
          ),
        ),
      ],
    );
  }
}

class _PendingMovesBar extends StatelessWidget {
  final int count;
  final bool saving;
  final VoidCallback onSave;
  final VoidCallback onCancel;

  const _PendingMovesBar({
    required this.count,
    required this.saving,
    required this.onSave,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6).withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.edit_location_alt_outlined,
              size: 18, color: Color(0xFF3B82F6)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              '$count ta stol pozitsiyasi o\'zgardi. Saqlash uchun OK bosing.',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Color(0xFF3B82F6),
                fontFamily: 'Inter',
              ),
            ),
          ),
          const SizedBox(width: 10),
          TextButton(
            onPressed: saving ? null : onCancel,
            style: TextButton.styleFrom(
              foregroundColor: colors.textSecondary,
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            ),
            child: Text(S.current.strCancelShort,
                style: const TextStyle(fontSize: 12, fontFamily: 'Inter')),
          ),
          const SizedBox(width: 6),
          ElevatedButton(
            onPressed: saving ? null : onSave,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3B82F6),
              foregroundColor: Colors.white,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              elevation: 0,
            ),
            child: saving
                ? const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 1.5,
                      valueColor: AlwaysStoppedAnimation(Colors.white),
                    ),
                  )
                : const Text(
                    'OK',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'Inter',
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DetailHeader extends StatelessWidget {
  final HallModel hall;
  final VoidCallback onBack;
  final VoidCallback onAdd;

  const _DetailHeader({
    required this.hall,
    required this.onBack,
    required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        _BackPill(onTap: onBack),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    S.current.strHalls,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: colors.textSecondary,
                      fontFamily: 'Inter',
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(Icons.chevron_right_rounded,
                        size: 14, color: colors.textSecondary),
                  ),
                  Text(
                    hall.name,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: colors.textDefault,
                      fontFamily: 'Inter',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 3),
              Text(
                hall.name,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.3,
                  color: colors.textDefault,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
        SectionPrimaryButton(
          icon: Icons.add_rounded,
          label: S.current.strNewTable,
          onPressed: onAdd,
        ),
      ],
    );
  }
}

class _BackPill extends StatefulWidget {
  final VoidCallback onTap;
  const _BackPill({required this.onTap});

  @override
  State<_BackPill> createState() => _BackPillState();
}

class _BackPillState extends State<_BackPill> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: Material(
        color: _hover ? colors.buttonBrand.withOpacity(0.10) : colors.bgDefault,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: widget.onTap,
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _hover
                    ? colors.buttonBrand.withOpacity(0.35)
                    : colors.border,
              ),
            ),
            child: Icon(
              Icons.arrow_back_rounded,
              size: 18,
              color: _hover ? colors.buttonBrand : colors.iconSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final int total;
  final int free;
  final int busy;
  final int capacity;

  const _StatsRow({
    required this.total,
    required this.free,
    required this.busy,
    required this.capacity,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.table_bar_rounded,
            label: S.current.strTotalTables,
            value: '$total',
            tint: colors.buttonBrand,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.people_outline_rounded,
            label: S.current.strTotalCapacity,
            value: '$capacity',
            tint: colors.textSecondary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.check_circle_outline_rounded,
            label: S.current.strFree,
            value: '$free',
            tint: const Color(0xFF16A34A),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.radio_button_checked_rounded,
            label: S.current.strBusy,
            value: '$busy',
            tint: const Color(0xFFE07A1F),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color tint;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.tint,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: colors.bgDefault,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: tint.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: tint),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: colors.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: colors.textDefault,
                    fontFamily: 'Inter',
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ───────────────────── Table edit dialog ──────────────────────

class _TableEditDialog extends StatefulWidget {
  final CafeTableModel? existing;
  final HallModel hall;
  final DioClient client;
  final int suggestedNumber;
  final int? prefillPosX;
  final int? prefillPosY;
  final List<CafeTableModel> siblings;
  final Future<void> Function(CafeTableModel)? onRequestDelete;

  const _TableEditDialog({
    required this.existing,
    required this.hall,
    required this.client,
    required this.suggestedNumber,
    this.prefillPosX,
    this.prefillPosY,
    this.siblings = const [],
    this.onRequestDelete,
  });

  @override
  State<_TableEditDialog> createState() => _TableEditDialogState();
}

class _TableEditDialogState extends State<_TableEditDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _numberCtrl;
  late final TextEditingController _capacityCtrl;
  late final TextEditingController _posXCtrl;
  late final TextEditingController _posYCtrl;
  late final TextEditingController _widthCtrl;
  late final TextEditingController _heightCtrl;
  late final TextEditingController _rotationCtrl;
  late final TextEditingController _priceCtrl;
  late TableShape _shape;
  late String _type; // 'simple' | 'time_based'
  late TableStatus _status;
  bool _saving = false;
  String? _saveError;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _numberCtrl = TextEditingController(
      text: (e?.number ?? widget.suggestedNumber).toString(),
    );
    _capacityCtrl = TextEditingController(text: (e?.capacity ?? 4).toString());
    final fallbackPosX = metersToPx(defaultTablePosMeters);
    final fallbackPosY = metersToPx(defaultTablePosMeters);
    final initPosX = e == null
        ? (widget.prefillPosX ?? fallbackPosX)
        : (e.posX <= 0 ? (widget.prefillPosX ?? fallbackPosX) : e.posX.toInt());
    final initPosY = e == null
        ? (widget.prefillPosY ?? fallbackPosY)
        : (e.posY <= 0 ? (widget.prefillPosY ?? fallbackPosY) : e.posY.toInt());
    _posXCtrl = TextEditingController(text: formatMeters(pxToMeters(initPosX)));
    _posYCtrl = TextEditingController(text: formatMeters(pxToMeters(initPosY)));
    _widthCtrl = TextEditingController(
      text: formatMeters(e != null ? pxToMeters(e.width) : defaultTableSizeMeters),
    );
    _heightCtrl = TextEditingController(
      text: formatMeters(e != null ? pxToMeters(e.height) : defaultTableSizeMeters),
    );
    _rotationCtrl = TextEditingController(
      text: (e?.rotation.toInt() ?? 0).toString(),
    );
    _priceCtrl = TextEditingController(text: '0');
    _shape = (e?.shape == TableShape.rectangle || e?.shape == null)
        ? TableShape.square
        : e!.shape;
    _type = e?.tableType ?? 'simple';
    _status = e?.status ?? TableStatus.free;
  }

  @override
  void dispose() {
    _numberCtrl.dispose();
    _capacityCtrl.dispose();
    _posXCtrl.dispose();
    _posYCtrl.dispose();
    _widthCtrl.dispose();
    _heightCtrl.dispose();
    _rotationCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  String? _nonNegativeMeters(String? v, {double max = 200}) {
    final s = v?.trim().replaceAll(',', '.') ?? '';
    if (s.isEmpty) return 'Kerakli maydon';
    final n = double.tryParse(s);
    if (n == null || n < 0) return 'Manfiy emas';
    if (n > max) return 'Juda katta qiymat';
    return null;
  }

  String? _positiveMeters(String? v) {
    final s = v?.trim().replaceAll(',', '.') ?? '';
    if (s.isEmpty) return 'Kerakli maydon';
    final n = double.tryParse(s);
    if (n == null || n <= 0) return 'Musbat qiymat kiriting';
    if (n > 20) return 'Juda katta (max 20 m)';
    return null;
  }

  String? _positiveInt(String? v, {int max = 9999}) {
    final s = v?.trim() ?? '';
    if (s.isEmpty) return 'Kerakli maydon';
    final n = int.tryParse(s);
    if (n == null || n <= 0) return 'Musbat son kiriting';
    if (n > max) return 'Juda katta qiymat';
    return null;
  }

  String? _rotationValidator(String? v) {
    final s = v?.trim() ?? '';
    if (s.isEmpty) return 'Kerakli maydon';
    final n = int.tryParse(s);
    if (n == null || n < 0 || n > 360) return '0 dan 360 gacha';
    return null;
  }

  String? _nonNegativeNumber(String? v) {
    final s = v?.trim().replaceAll(' ', '').replaceAll(',', '.') ?? '';
    if (s.isEmpty) return 'Kerakli maydon';
    final n = double.tryParse(s);
    if (n == null || n < 0) return 'Manfiy bo\'lmasin';
    return null;
  }

  String _shapeToApi(TableShape s) {
    switch (s) {
      case TableShape.rectangle:
        return 'rectangle';
      case TableShape.circle:
        return 'circle';
      case TableShape.square:
        return 'square';
    }
  }

  String _statusToApi(TableStatus s) {
    switch (s) {
      case TableStatus.free:
        return 'free';
      case TableStatus.busy:
        return 'busy';
      case TableStatus.away:
        return 'away';
      case TableStatus.none:
        return 'none';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _saveError = null;
    });
    final number = int.parse(_numberCtrl.text.trim());
    final capacity = int.parse(_capacityCtrl.text.trim());
    final posX = metersToPx(double.parse(_posXCtrl.text.trim().replaceAll(',', '.')));
    final posY = metersToPx(double.parse(_posYCtrl.text.trim().replaceAll(',', '.')));
    final width = metersToPx(double.parse(_widthCtrl.text.trim().replaceAll(',', '.')));
    final height = metersToPx(double.parse(_heightCtrl.text.trim().replaceAll(',', '.')));
    final rotation = int.parse(_rotationCtrl.text.trim());
    // backend price_per_hour ni string kutadi
    final pricePerHour = _type == 'time_based'
        ? (_priceCtrl.text.trim().replaceAll(' ', '').replaceAll(',', '.').isEmpty
            ? '0'
            : _priceCtrl.text.trim().replaceAll(' ', '').replaceAll(',', '.'))
        : null;
    final existing = widget.existing;

    try {
      if (existing == null) {
        await widget.client.post(
          ListAPI.cafeTables,
          data: {
            'hall_id': widget.hall.id,
            'number': number,
            'capacity': capacity,
            'status': _statusToApi(_status),
            'shape': _shapeToApi(_shape),
            'table_type': _type,
            'pos_x': posX,
            'pos_y': posY,
            'width': width,
            'height': height,
            'rotation': rotation,
            'price_per_hour': ?pricePerHour,
          },
        );
      } else {
        await widget.client.put(
          ListAPI.cafeTableById(existing.id),
          data: {
            'hall_id': widget.hall.id,
            'number': number,
            'capacity': capacity,
            'status': _statusToApi(_status),
            'shape': _shapeToApi(_shape),
            'table_type': _type,
            'pos_x': posX,
            'pos_y': posY,
            'width': width,
            'height': height,
            'rotation': rotation,
            'price_per_hour': ?pricePerHour,
          },
        );
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _saveError = _readError(e) ?? S.current.strSaveError;
      });
    }
  }

  String? _readError(DioException e) => userFriendlyDioError(e);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isEdit = widget.existing != null;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding:
          const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 540),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 22, 16, 18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colors.buttonBrand.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isEdit ? Icons.edit_outlined : Icons.add_rounded,
                      color: colors.buttonBrand,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit ? 'Stolni tahrirlash' : S.current.strNewTable,
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: colors.textDefault,
                            fontFamily: 'Inter',
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          widget.hall.name,
                          style: TextStyle(
                            fontSize: 12,
                            color: colors.textSecondary,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context, false),
                    icon: Icon(Icons.close_rounded,
                        size: 20, color: colors.iconSecondary),
                    splashRadius: 18,
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 4, 24, 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strTableNumber,
                              child: _HallTextField(
                                controller: _numberCtrl,
                                hint: '1',
                                keyboard: TextInputType.number,
                                validator: (v) =>
                                    _positiveInt(v, max: 9999),
                                formatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strCapacityPersons,
                              child: _HallTextField(
                                controller: _capacityCtrl,
                                hint: '4',
                                keyboard: TextInputType.number,
                                validator: (v) => _positiveInt(v, max: 200),
                                formatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _LabeledField(
                        label: S.current.strShape,
                        child: _SegmentedSelector<TableShape>(
                          value: _shape,
                          options: [
                            _SegOption(
                              value: TableShape.square,
                              icon: Icons.square_outlined,
                              label: S.current.strSquare,
                            ),
                            _SegOption(
                              value: TableShape.circle,
                              icon: Icons.circle_outlined,
                              label: S.current.strRound,
                            ),
                          ],
                          onChanged: (v) => setState(() => _shape = v),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _LabeledField(
                        label: S.current.strTableType,
                        child: _SegmentedSelector<String>(
                          value: _type,
                          options: [
                            _SegOption(
                              value: 'simple',
                              icon: Icons.receipt_long_outlined,
                              label: S.current.strRegular,
                              helper: 'Menyu bo\'yicha',
                            ),
                            _SegOption(
                              value: 'time_based',
                              icon: Icons.timer_outlined,
                              label: S.current.strHourly,
                              helper: 'Vaqt bo\'yicha',
                            ),
                          ],
                          onChanged: (v) => setState(() => _type = v),
                        ),
                      ),
                      if (_type == 'time_based') ...[
                        const SizedBox(height: 16),
                        _LabeledField(
                          label: S.current.strHourlyPrice,
                          child: _HallTextField(
                            controller: _priceCtrl,
                            hint: '50 000',
                            keyboard: TextInputType.number,
                            validator: _nonNegativeNumber,
                            formatters: [_ThousandsFormatter()],
                          ),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strWidthMeters,
                              child: _HallTextField(
                                controller: _widthCtrl,
                                hint: '0.8',
                                keyboard: const TextInputType.numberWithOptions(decimal: true),
                                validator: _positiveMeters,
                                formatters: [
                                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strHeightMeters,
                              child: _HallTextField(
                                controller: _heightCtrl,
                                hint: '0.8',
                                keyboard: const TextInputType.numberWithOptions(decimal: true),
                                validator: _positiveMeters,
                                formatters: [
                                  FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strAngleDegrees,
                              child: _HallTextField(
                                controller: _rotationCtrl,
                                hint: '0',
                                keyboard: TextInputType.number,
                                validator: _rotationValidator,
                                formatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _LabeledField(
                        label: S.current.strInitialStatus,
                        child: _SegmentedSelector<TableStatus>(
                          value: _status,
                          options: [
                            _SegOption(
                              value: TableStatus.free,
                              icon: Icons.check_circle_outline_rounded,
                              label: S.current.strFree,
                            ),
                            _SegOption(
                              value: TableStatus.busy,
                              icon: Icons.radio_button_checked_rounded,
                              label: S.current.strBusy,
                            ),
                            _SegOption(
                              value: TableStatus.away,
                              icon: Icons.do_not_disturb_on_outlined,
                              label: S.current.strClosedStatus,
                            ),
                          ],
                          onChanged: (v) => setState(() => _status = v),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _LabeledField(
                        label: S.current.strLocationMap,
                        child: _HallPositionCanvas(
                          hallWidth: widget.hall.width,
                          hallHeight: widget.hall.height,
                          tableWidth: metersToPx(
                            double.tryParse(_widthCtrl.text.replaceAll(',', '.')) ?? defaultTableSizeMeters,
                          ).toDouble(),
                          tableHeight: metersToPx(
                            double.tryParse(_heightCtrl.text.replaceAll(',', '.')) ?? defaultTableSizeMeters,
                          ).toDouble(),
                          shape: _shape,
                          posXCtrl: _posXCtrl,
                          posYCtrl: _posYCtrl,
                          siblings: widget.siblings,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strPositionX,
                              child: _HallTextField(
                                controller: _posXCtrl,
                                hint: '0.4',
                                keyboard: const TextInputType
                                    .numberWithOptions(decimal: true),
                                validator: _nonNegativeMeters,
                                formatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.,]')),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strPositionY,
                              child: _HallTextField(
                                controller: _posYCtrl,
                                hint: '0.4',
                                keyboard: const TextInputType
                                    .numberWithOptions(decimal: true),
                                validator: _nonNegativeMeters,
                                formatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.,]')),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Stolni sudrab qo\'yish yoki qiymatni qo\'lda kiritish mumkin. Floor-plan ekranida ham pozitsiya tahrirlanadi.',
                        style: TextStyle(
                          fontSize: 11,
                          color: colors.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      if (_saveError != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: colors.systemError.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline,
                                  size: 16, color: colors.systemError),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _saveError!,
                                  style: TextStyle(
                                    color: colors.systemError,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    fontFamily: 'Inter',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colors.border)),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                children: [
                  if (isEdit && widget.onRequestDelete != null)
                    _DangerButton(
                      label: S.current.strDelete,
                      onPressed: _saving
                          ? null
                          : () async {
                              final t = widget.existing!;
                              Navigator.pop(context, false);
                              await widget.onRequestDelete!(t);
                            },
                    ),
                  const Spacer(),
                  _GhostButton(
                    label: S.current.strCancel,
                    onPressed:
                        _saving ? null : () => Navigator.pop(context, false),
                  ),
                  const SizedBox(width: 8),
                  _SavingButton(
                    saving: _saving,
                    label: isEdit ? S.current.strSave : S.current.strAdd,
                    onPressed: _saving ? null : _save,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SegOption<T> {
  final T value;
  final IconData icon;
  final String label;
  final String? helper;
  const _SegOption({
    required this.value,
    required this.icon,
    required this.label,
    this.helper,
  });
}

class _SegmentedSelector<T> extends StatelessWidget {
  final T value;
  final List<_SegOption<T>> options;
  final ValueChanged<T> onChanged;

  const _SegmentedSelector({
    required this.value,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        children: options.map((o) {
          final selected = o.value == value;
          return Expanded(
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              curve: Curves.easeOutCubic,
              margin: const EdgeInsets.symmetric(horizontal: 2),
              decoration: BoxDecoration(
                color: selected ? colors.bgDefault : Colors.transparent,
                borderRadius: BorderRadius.circular(9),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.06),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                      ]
                    : null,
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(9),
                  onTap: () => onChanged(o.value),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 10,
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          o.icon,
                          size: 16,
                          color: selected
                              ? colors.buttonBrand
                              : colors.textSecondary,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          o.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: selected
                                ? colors.buttonBrand
                                : colors.textDefault,
                            fontFamily: 'Inter',
                          ),
                        ),
                        if (o.helper != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            o.helper!,
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                              color: colors.textSecondary,
                              fontFamily: 'Inter',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ───────────────────── Position canvas ──────────────────────

class _HallPositionCanvas extends StatefulWidget {
  final double hallWidth;
  final double hallHeight;
  final double tableWidth;
  final double tableHeight;
  final TableShape shape;
  final TextEditingController posXCtrl;
  final TextEditingController posYCtrl;
  final List<CafeTableModel> siblings;

  const _HallPositionCanvas({
    required this.hallWidth,
    required this.hallHeight,
    required this.tableWidth,
    required this.tableHeight,
    required this.shape,
    required this.posXCtrl,
    required this.posYCtrl,
    this.siblings = const [],
  });

  @override
  State<_HallPositionCanvas> createState() => _HallPositionCanvasState();
}

class _HallPositionCanvasState extends State<_HallPositionCanvas> {
  bool _dragging = false;

  @override
  void initState() {
    super.initState();
    widget.posXCtrl.addListener(_onTextChanged);
    widget.posYCtrl.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    widget.posXCtrl.removeListener(_onTextChanged);
    widget.posYCtrl.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    if (_dragging) return;
    if (mounted) setState(() {});
  }

  double get _posXPx => metersToPx(double.tryParse(
          widget.posXCtrl.text.trim().replaceAll(',', '.')) ??
      0).toDouble();
  double get _posYPx => metersToPx(double.tryParse(
          widget.posYCtrl.text.trim().replaceAll(',', '.')) ??
      0).toDouble();

  void _commit(double xPx, double yPx) {
    final rawX = widget.hallWidth - widget.tableWidth;
    final rawY = widget.hallHeight - widget.tableHeight;
    final maxX = rawX < 0 ? 0.0 : rawX;
    final maxY = rawY < 0 ? 0.0 : rawY;
    double clampX(double x) => x.clamp(0.0, maxX);
    double clampY(double y) => y.clamp(0.0, maxY);

    const gapPx = 40.0;
    bool collides(double x, double y) {
      for (final s in widget.siblings) {
        final sw = s.width <= 0 ? widget.tableWidth : s.width;
        final sh = s.height <= 0 ? widget.tableHeight : s.height;
        if (x < s.posX + sw + gapPx &&
            x + widget.tableWidth + gapPx > s.posX &&
            y < s.posY + sh + gapPx &&
            y + widget.tableHeight + gapPx > s.posY) {
          return true;
        }
      }
      return false;
    }

    final px = clampX(xPx);
    final py = clampY(yPx);

    double nx = px;
    double ny = py;
    if (collides(nx, ny)) {
      final curX = _posXPx;
      final curY = _posYPx;
      if (!collides(px, curY)) {
        nx = px;
        ny = curY;
      } else if (!collides(curX, py)) {
        nx = curX;
        ny = py;
      } else {
        nx = curX;
        ny = curY;
      }
    }

    widget.posXCtrl.text = formatMeters(pxToMeters(nx));
    widget.posYCtrl.text = formatMeters(pxToMeters(ny));
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return LayoutBuilder(
      builder: (context, constraints) {
        final maxW = constraints.maxWidth;
        final aspect = widget.hallHeight / widget.hallWidth;
        final canvasW = maxW;
        final canvasH = (canvasW * aspect).clamp(160.0, 300.0);
        final scale = canvasW / widget.hallWidth;
        final markerW = widget.tableWidth * scale;
        final markerH = widget.tableHeight * scale;
        final maxMX = (canvasW - markerW) < 0 ? 0.0 : canvasW - markerW;
        final maxMY = (canvasH - markerH) < 0 ? 0.0 : canvasH - markerH;
        final markerX = (_posXPx * scale).clamp(0.0, maxMX);
        final markerY = (_posYPx * scale).clamp(0.0, maxMY);
        final isCircle = widget.shape == TableShape.circle;

        return ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: Container(
            width: canvasW,
            height: canvasH,
            decoration: BoxDecoration(
              color: colors.bgSecondary,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: colors.border),
            ),
            child: Stack(
              children: [
                Positioned.fill(
                  child: CustomPaint(
                    painter: _GridPainter(
                      color: colors.border.withOpacity(0.5),
                      step: (100 * scale).clamp(16.0, 80.0),
                    ),
                  ),
                ),
                ...widget.siblings.map((t) {
                  final sw = (t.width <= 0 ? widget.tableWidth : t.width) * scale;
                  final sh = (t.height <= 0 ? widget.tableHeight : t.height) * scale;
                  final maxSX = (canvasW - sw) < 0 ? 0.0 : canvasW - sw;
                  final maxSY = (canvasH - sh) < 0 ? 0.0 : canvasH - sh;
                  final sx = (t.posX * scale).clamp(0.0, maxSX);
                  final sy = (t.posY * scale).clamp(0.0, maxSY);
                  final isCircleS = t.shape == TableShape.circle;
                  return Positioned(
                    left: sx,
                    top: sy,
                    width: sw,
                    height: sh,
                    child: IgnorePointer(
                      child: Container(
                        decoration: BoxDecoration(
                          color: colors.textTertiary.withOpacity(0.18),
                          borderRadius: isCircleS
                              ? BorderRadius.circular(sw)
                              : BorderRadius.circular(6),
                          border: Border.all(
                            color: colors.textTertiary.withOpacity(0.45),
                            width: 1,
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${t.number}',
                          style: TextStyle(
                            fontSize: (sw * 0.28).clamp(9.0, 14.0),
                            fontWeight: FontWeight.w600,
                            color: colors.textSecondary,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ),
                    ),
                  );
                }),
                Positioned.fill(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTapDown: (d) {
                      final x =
                          d.localPosition.dx / scale - widget.tableWidth / 2;
                      final y =
                          d.localPosition.dy / scale - widget.tableHeight / 2;
                      _commit(x, y);
                    },
                    onPanStart: (_) => _dragging = true,
                    onPanUpdate: (d) {
                      final x =
                          d.localPosition.dx / scale - widget.tableWidth / 2;
                      final y =
                          d.localPosition.dy / scale - widget.tableHeight / 2;
                      _commit(x, y);
                    },
                    onPanEnd: (_) => _dragging = false,
                  ),
                ),
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 120),
                  curve: Curves.easeOut,
                  left: markerX,
                  top: markerY,
                  width: markerW,
                  height: markerH,
                  child: IgnorePointer(
                    child: Container(
                      decoration: BoxDecoration(
                        color: colors.buttonBrand.withOpacity(0.85),
                        borderRadius: isCircle
                            ? BorderRadius.circular(markerW)
                            : BorderRadius.circular(6),
                        border: Border.all(
                            color: colors.buttonBrand, width: 1.5),
                        boxShadow: [
                          BoxShadow(
                            color: colors.buttonBrand.withOpacity(0.35),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      alignment: Alignment.center,
                      child: const Icon(
                        Icons.open_with_rounded,
                        size: 14,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  left: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.bgDefault.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: colors.border),
                    ),
                    child: Text(
                      '${formatMeters(pxToMeters(widget.hallWidth))} × ${formatMeters(pxToMeters(widget.hallHeight))} m',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: colors.textSecondary,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 8,
                  bottom: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colors.buttonBrand.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${formatMeters(pxToMeters(_posXPx))}, ${formatMeters(pxToMeters(_posYPx))} m',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: colors.buttonBrand,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _GridPainter extends CustomPainter {
  final Color color;
  final double step;
  _GridPainter({required this.color, required this.step});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 0.6;
    for (double x = step; x < size.width; x += step) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = step; y < size.height; y += step) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant _GridPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.step != step;
}

// ───────────────────── Shared dialog primitives ──────────────────────

class _GhostIconButton extends StatefulWidget {
  final IconData icon;
  final String tooltip;
  final Color? color;
  final VoidCallback onTap;

  const _GhostIconButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
    this.color,
  });

  @override
  State<_GhostIconButton> createState() => _GhostIconButtonState();
}

class _GhostIconButtonState extends State<_GhostIconButton> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final iconColor = widget.color ?? colors.buttonBrand;
    return Tooltip(
      message: widget.tooltip,
      child: MouseRegion(
        onEnter: (_) => setState(() => _hover = true),
        onExit: (_) => setState(() => _hover = false),
        child: Material(
          // Doimo brand soyasi — hover'da intensivlik oshadi.
          color: iconColor.withOpacity(_hover ? 0.18 : 0.10),
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: widget.onTap,
            child: SizedBox(
              width: 44,
              height: 44,
              child: Icon(widget.icon, size: 22, color: iconColor),
            ),
          ),
        ),
      ),
    );
  }
}

class _ConfirmDeleteDialog extends StatelessWidget {
  final String title;
  final String message;
  const _ConfirmDeleteDialog({required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 420),
        child: Padding(
          padding: const EdgeInsets.all(22),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colors.systemError.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(Icons.warning_amber_rounded,
                        color: colors.systemError, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: colors.textDefault,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                message,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.5,
                  color: colors.textSecondary,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _GhostButton(
                    label: S.current.strCancel,
                    onPressed: () => Navigator.pop(context, false),
                  ),
                  const SizedBox(width: 8),
                  _DangerButton(
                    label: S.current.strDelete,
                    onPressed: () => Navigator.pop(context, true),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GhostButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  const _GhostButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onPressed,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: colors.border),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: colors.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
        ),
      ),
    );
  }
}

class _DangerButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  const _DangerButton({required this.label, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Material(
      color: colors.systemError,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              fontFamily: 'Inter',
            ),
          ),
        ),
      ),
    );
  }
}

class _HallEditDialog extends StatefulWidget {
  final HallModel? existing;
  final String branchId;
  final DioClient client;

  const _HallEditDialog({
    required this.existing,
    required this.branchId,
    required this.client,
  });

  @override
  State<_HallEditDialog> createState() => _HallEditDialogState();
}

class _HallEditDialogState extends State<_HallEditDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _widthCtrl;
  late final TextEditingController _heightCtrl;
  bool _saving = false;
  String? _saveError;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl = TextEditingController(text: e?.name ?? '');
    final wM = e != null
        ? pxToMeters(e.width)
        : defaultHallWidthMeters;
    final hM = e != null
        ? pxToMeters(e.height)
        : defaultHallHeightMeters;
    _widthCtrl = TextEditingController(text: formatMeters(wM));
    _heightCtrl = TextEditingController(text: formatMeters(hM));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _widthCtrl.dispose();
    _heightCtrl.dispose();
    super.dispose();
  }

  String? _required(String? v) {
    if (v == null || v.trim().isEmpty) return 'Kerakli maydon';
    return null;
  }

  String? _positiveMeters(String? v) {
    final s = v?.trim().replaceAll(',', '.') ?? '';
    if (s.isEmpty) return 'Kerakli maydon';
    final n = double.tryParse(s);
    if (n == null || n <= 0) return 'Musbat qiymat kiriting';
    if (n > 200) return 'Juda katta qiymat';
    return null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _saving = true;
      _saveError = null;
    });
    final widthM =
        double.parse(_widthCtrl.text.trim().replaceAll(',', '.'));
    final heightM =
        double.parse(_heightCtrl.text.trim().replaceAll(',', '.'));
    final width = metersToPx(widthM);
    final height = metersToPx(heightM);
    final name = _nameCtrl.text.trim();

    try {
      if (widget.existing == null) {
        await widget.client.post(
          ListAPI.halls,
          data: {
            'name': name,
            'branch_id': widget.branchId,
            'width': width,
            'height': height,
          },
        );
      } else {
        await widget.client.put(
          '${ListAPI.halls}/${widget.existing!.id}',
          data: {
            'name': name,
            'width': width,
            'height': height,
          },
        );
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } on DioException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _saveError = _readError(e) ?? 'Saqlashda xatolik';
      });
    }
  }

  String? _readError(DioException e) => userFriendlyDioError(e);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isEdit = widget.existing != null;
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      insetPadding:
          const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 480),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 22, 16, 18),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: colors.buttonBrand.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isEdit ? Icons.edit_outlined : Icons.add_rounded,
                      color: colors.buttonBrand,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit ? 'Zalni tahrirlash' : S.current.strAddNewHall,
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            color: colors.textDefault,
                            fontFamily: 'Inter',
                            letterSpacing: -0.2,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isEdit
                              ? 'Zal nomini va o\'lchamlarini yangilang'
                              : 'Yangi zal uchun nom va o\'lcham kiriting',
                          style: TextStyle(
                            fontSize: 12,
                            color: colors.textSecondary,
                            fontFamily: 'Inter',
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context, false),
                    icon: Icon(Icons.close_rounded,
                        size: 20, color: colors.iconSecondary),
                    splashRadius: 18,
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 4, 24, 20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _LabeledField(
                        label: S.current.strHallName,
                        child: _HallTextField(
                          controller: _nameCtrl,
                          hint: 'Masalan, Asosiy zal',
                          validator: _required,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strWidthShort,
                              child: _HallTextField(
                                controller: _widthCtrl,
                                hint: '8',
                                keyboard: const TextInputType
                                    .numberWithOptions(decimal: true),
                                validator: _positiveMeters,
                                formatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.,]')),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _LabeledField(
                              label: S.current.strHeightShort,
                              child: _HallTextField(
                                controller: _heightCtrl,
                                hint: '6',
                                keyboard: const TextInputType
                                    .numberWithOptions(decimal: true),
                                validator: _positiveMeters,
                                formatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.,]')),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'O\'lchamlar metrda kiritiladi. Floor-plan kanvasida shu o\'lchamlar ishlatiladi.',
                        style: TextStyle(
                          fontSize: 11,
                          color: colors.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      if (_saveError != null) ...[
                        const SizedBox(height: 14),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: colors.systemError.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline,
                                  size: 16, color: colors.systemError),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _saveError!,
                                  style: TextStyle(
                                    color: colors.systemError,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    fontFamily: 'Inter',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: colors.border)),
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _GhostButton(
                    label: S.current.strCancel,
                    onPressed:
                        _saving ? null : () => Navigator.pop(context, false),
                  ),
                  const SizedBox(width: 8),
                  _SavingButton(
                    saving: _saving,
                    label: isEdit ? S.current.strSave : S.current.strAdd,
                    onPressed: _saving ? null : _save,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SavingButton extends StatelessWidget {
  final bool saving;
  final String label;
  final VoidCallback? onPressed;

  const _SavingButton({
    required this.saving,
    required this.label,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Material(
      color: onPressed == null
          ? colors.buttonBrand.withOpacity(0.6)
          : colors.buttonBrand,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onPressed,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 11),
          child: saving
              ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                      strokeWidth: 2, color: Colors.white),
                )
              : Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: colors.textOnBrand,
                    fontFamily: 'Inter',
                  ),
                ),
        ),
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  final String label;
  final Widget child;
  const _LabeledField({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: colors.textDefault,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _ThousandsFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final digits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) {
      return newValue.copyWith(text: '', selection: const TextSelection.collapsed(offset: 0));
    }
    final formatted = _addSpaces(digits);
    return newValue.copyWith(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }

  static String _addSpaces(String digits) {
    final buf = StringBuffer();
    final start = digits.length % 3;
    for (int i = 0; i < digits.length; i++) {
      if (i != 0 && (i - start) % 3 == 0) buf.write(' ');
      buf.write(digits[i]);
    }
    return buf.toString();
  }
}

class _HallTextField extends StatelessWidget {
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboard;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? formatters;

  const _HallTextField({
    required this.controller,
    this.hint,
    this.keyboard,
    this.validator,
    this.formatters,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return TextFormField(
      controller: controller,
      keyboardType: keyboard,
      validator: validator,
      inputFormatters: formatters,
      style: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w500,
        color: colors.textDefault,
        fontFamily: 'Inter',
      ),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(
          fontSize: 14,
          color: colors.textSecondary.withOpacity(0.7),
          fontFamily: 'Inter',
        ),
        isDense: true,
        filled: true,
        fillColor: colors.bgSecondary,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
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
          borderSide: BorderSide(color: colors.buttonBrand, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colors.systemError),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: colors.systemError, width: 1.5),
        ),
      ),
    );
  }
}
