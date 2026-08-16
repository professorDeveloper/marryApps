import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mary_ai_pos/core/api/api_error_overlay.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';
import 'package:mary_ai_pos/core/components/flush_bars.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/service/printer/printer_setting_entry.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/data/models/category/category_model.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/widgets/section_shell.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class PrintersSection extends StatefulWidget {
  const PrintersSection({super.key});

  @override
  State<PrintersSection> createState() => _PrintersSectionState();
}

class _PrintersSectionState extends State<PrintersSection> {
  final DioClient _client = inject<DioClient>();

  bool _loading = true;
  String? _error;
  List<PrinterSettingEntry> _items = const [];
  List<CategoryModel> _categories = const [];

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _client.get(ListAPI.printerSettings),
        _client.get(ListAPI.categories),
      ]);
      final printersRoot = results[0].data;
      final categoriesRoot = results[1].data;

      List<dynamic> printersData = const [];
      if (printersRoot is Map && printersRoot['data'] is List) {
        printersData = printersRoot['data'] as List;
      } else if (printersRoot is List) {
        printersData = printersRoot;
      }

      List<dynamic> categoriesData = const [];
      if (categoriesRoot is Map && categoriesRoot['data'] is List) {
        categoriesData = categoriesRoot['data'] as List;
      } else if (categoriesRoot is List) {
        categoriesData = categoriesRoot;
      }

      if (!mounted) return;
      setState(() {
        _items = PrinterSettingEntry.listFromJsonList(printersData);
        _categories = categoriesData
            .map((e) =>
                CategoryModel.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
        _loading = false;
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

  Future<void> _openEditor({PrinterSettingEntry? existing}) async {
    final saved = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (_) => _PrinterEditDialog(
        existing: existing,
        categories: _categories,
        client: _client,
      ),
    );
    if (saved == true && mounted) {
      _loadAll();
    }
  }

  Future<void> _confirmDelete(PrinterSettingEntry item) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => _ConfirmDeleteDialog(
        title: S.current.strDeletePrinter,
        message:
            '${item.ip}:${item.port} printerini o\'chirmoqchimisiz? Buni bekor qilib bo\'lmaydi.',
      ),
    );
    if (ok != true || !mounted) return;
    try {
      await _client.delete('${ListAPI.printerSettings}/${item.id}');
      if (!mounted) return;
      _loadAll();
    } on DioException catch (e) {
      if (!mounted) return;
      showErrorMessage(context, _readError(e) ?? S.current.strDeleteError);
    }
  }

  String _categoryName(String id) {
    final c = _categories.firstWhere(
      (x) => x.id == id,
      orElse: () => const CategoryModel(id: '', name: ''),
    );
    return c.name.isNotEmpty ? c.name : id;
  }

  @override
  Widget build(BuildContext context) {
    return SectionShell(
      title: S.current.strPrinterSettings,
      subtitle:
          '${_items.length} ta ESC/POS qurilma — kategoriya va chek printerlari',
      trailing: SectionPrimaryButton(
        icon: Icons.add_rounded,
        label: S.current.strAddPrinter,
        onPressed: () => _openEditor(),
      ),
      child: _buildBody(),
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
              onPressed: _loadAll,
            ),
          ],
        ),
      );
    }
    if (_items.isEmpty) {
      return SectionEmptyState(
        icon: Icons.print_outlined,
        title: S.current.strNoPrintersYet,
        subtitle:
            'Kategoriyalar va yopiq cheklar uchun ESC/POS TCP printerlarni shu yerdan qo\'shing.',
        action: SectionPrimaryButton(
          icon: Icons.add_rounded,
          label: S.current.strAddFirstPrinter,
          onPressed: () => _openEditor(),
        ),
      );
    }
    return ListView.separated(
      padding: EdgeInsets.zero,
      itemCount: _items.length,
      separatorBuilder: (_, _) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _PrinterCard(
        entry: _items[i],
        categoryNameFor: _categoryName,
        onEdit: () => _openEditor(existing: _items[i]),
        onDelete: () => _confirmDelete(_items[i]),
      ),
    );
  }
}

class _PrinterCard extends StatefulWidget {
  final PrinterSettingEntry entry;
  final String Function(String id) categoryNameFor;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _PrinterCard({
    required this.entry,
    required this.categoryNameFor,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  State<_PrinterCard> createState() => _PrinterCardState();
}

class _PrinterCardState extends State<_PrinterCard> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final entry = widget.entry;
    final isCloseCheck = entry.isCloseCheck;
    final typeColor = isCloseCheck ? colors.extraOrange : colors.systemAccent;
    final connectionIcon =
        entry.connectionType == 'wlan' ? Icons.wifi_rounded : Icons.cable_rounded;
    final connLabel = entry.connectionType == 'wlan' ? S.current.strWiFi : S.current.strCable;

    return MouseRegion(
      onEnter: (_) => setState(() => _hover = true),
      onExit: (_) => setState(() => _hover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOutCubic,
        decoration: BoxDecoration(
          color: colors.bgDefault,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: _hover ? colors.buttonBrand : colors.border,
            width: _hover ? 1.5 : 1,
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: typeColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(Icons.print_rounded, color: typeColor, size: 22),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        '${entry.ip}:${entry.port}',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: colors.textDefault,
                          fontFamily: 'Inter',
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(width: 10),
                      _Badge(
                        color: typeColor,
                        label: isCloseCheck ? S.current.strCheckPrinter : S.current.strCategory,
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(connectionIcon,
                          size: 13, color: colors.textSecondary),
                      const SizedBox(width: 5),
                      Text(
                        connLabel,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: colors.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                      if (entry.isCategory) ...[
                        _Dot(color: colors.border),
                        Flexible(
                          child: Text(
                            _categoriesLabel(entry),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: colors.textSecondary,
                              fontFamily: 'Inter',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
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
    );
  }

  String _categoriesLabel(PrinterSettingEntry entry) {
    if (entry.connectedEntityIds.isEmpty) {
      return 'Kategoriyalar tanlanmagan';
    }
    final names =
        entry.connectedEntityIds.take(3).map(widget.categoryNameFor).join(', ');
    final more = entry.connectedEntityIds.length > 3
        ? ' +${entry.connectedEntityIds.length - 3}'
        : '';
    return '$names$more';
  }
}

class _Badge extends StatelessWidget {
  final Color color;
  final String label;
  const _Badge({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: color,
          fontFamily: 'Inter',
          letterSpacing: 0.1,
        ),
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final Color color;
  const _Dot({required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Container(
        width: 3,
        height: 3,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

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
                  _DialogButton.ghost(
                    label: S.current.strCancel,
                    onPressed: () => Navigator.pop(context, false),
                  ),
                  const SizedBox(width: 8),
                  _DialogButton.danger(
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

class _DialogButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final _ButtonKind kind;

  const _DialogButton._(this.kind,
      {required this.label, required this.onPressed});

  factory _DialogButton.ghost(
          {required String label, required VoidCallback? onPressed}) =>
      _DialogButton._(_ButtonKind.ghost, label: label, onPressed: onPressed);

  factory _DialogButton.danger(
          {required String label, required VoidCallback? onPressed}) =>
      _DialogButton._(_ButtonKind.danger, label: label, onPressed: onPressed);

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    late final Color bg;
    late final Color fg;
    late final BorderSide border;
    switch (kind) {
      case _ButtonKind.ghost:
        bg = Colors.transparent;
        fg = colors.textSecondary;
        border = BorderSide(color: colors.border);
        break;
      case _ButtonKind.danger:
        bg = colors.systemError;
        fg = Colors.white;
        border = BorderSide.none;
        break;
    }
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onPressed,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.fromBorderSide(border),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: fg,
              fontFamily: 'Inter',
            ),
          ),
        ),
      ),
    );
  }
}

enum _ButtonKind { ghost, danger }

class _PrinterEditDialog extends StatefulWidget {
  final PrinterSettingEntry? existing;
  final List<CategoryModel> categories;
  final DioClient client;

  const _PrinterEditDialog({
    required this.existing,
    required this.categories,
    required this.client,
  });

  @override
  State<_PrinterEditDialog> createState() => _PrinterEditDialogState();
}

class _PrinterEditDialogState extends State<_PrinterEditDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _ipCtrl;
  late final TextEditingController _portCtrl;
  String _type = 'category';
  String _connection = 'cable';
  final Set<String> _selectedCategoryIds = {};
  bool _saving = false;
  String? _saveError;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _ipCtrl = TextEditingController(text: e?.ip ?? '');
    _portCtrl = TextEditingController(text: (e?.port ?? 9100).toString());
    if (e != null) {
      _type = e.type.isNotEmpty ? e.type : 'category';
      _connection = e.connectionType.isNotEmpty ? e.connectionType : 'cable';
      _selectedCategoryIds.addAll(e.connectedEntityIds);
    }
  }

  @override
  void dispose() {
    _ipCtrl.dispose();
    _portCtrl.dispose();
    super.dispose();
  }

  String? _validateIp(String? v) {
    final s = v?.trim() ?? '';
    if (s.isEmpty) return 'IP manzil kerak';
    final parts = s.split('.');
    if (parts.length != 4) return 'IPv4 noto\'g\'ri (192.168.1.100)';
    for (final p in parts) {
      final n = int.tryParse(p);
      if (n == null || n < 0 || n > 255) return 'IPv4 noto\'g\'ri';
    }
    return null;
  }

  String? _validatePort(String? v) {
    final s = v?.trim() ?? '';
    if (s.isEmpty) return 'Port kerak';
    final n = int.tryParse(s);
    if (n == null || n <= 0 || n > 65535) return 'Port 1–65535 oraliqda';
    return null;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_type == 'category' && _selectedCategoryIds.isEmpty) {
      setState(() => _saveError = 'Kamida bitta kategoriya tanlang');
      return;
    }
    setState(() {
      _saving = true;
      _saveError = null;
    });
    final body = {
      'ip': _ipCtrl.text.trim(),
      'port': int.parse(_portCtrl.text.trim()),
      'type': _type,
      'connection_type': _connection,
      'connected_entity_ids':
          _type == 'category' ? _selectedCategoryIds.toList() : <String>[],
    };
    try {
      if (widget.existing == null) {
        await widget.client.post(ListAPI.printerSettings, data: body);
      } else {
        await widget.client.put(
          '${ListAPI.printerSettings}/${widget.existing!.id}',
          data: body,
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
        constraints: const BoxConstraints(maxWidth: 560),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _DialogHeader(
              icon: isEdit ? Icons.edit_outlined : Icons.add_rounded,
              title: isEdit ? S.current.strEditPrinter : S.current.strAddPrinter,
              subtitle: isEdit
                  ? 'Printer sozlamalarini o\'zgartiring'
                  : 'Yangi ESC/POS TCP printerni qo\'shing',
              onClose: () => Navigator.pop(context, false),
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
                            flex: 3,
                            child: _LabeledField(
                              label: S.current.strIPAddress,
                              child: _TextField(
                                controller: _ipCtrl,
                                hint: '192.168.1.100',
                                validator: _validateIp,
                                formatters: [
                                  FilteringTextInputFormatter.allow(
                                      RegExp(r'[0-9.]')),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: _LabeledField(
                              label: S.current.strPort,
                              child: _TextField(
                                controller: _portCtrl,
                                hint: '9100',
                                keyboard: TextInputType.number,
                                validator: _validatePort,
                                formatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      _LabeledField(
                        label: S.current.strPrinterType,
                        child: _SegmentedChoice<String>(
                          value: _type,
                          onChanged: (v) => setState(() => _type = v),
                          options: [
                            _ChoiceOption(
                              value: 'category',
                              label: S.current.strCategory,
                              icon: Icons.restaurant_menu_rounded,
                              helper: 'Taomlar uchun',
                            ),
                            _ChoiceOption(
                              value: 'close_check',
                              label: S.current.strCheckPrinter,
                              icon: Icons.receipt_long_rounded,
                              helper: 'Yopish uchun',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                      _LabeledField(
                        label: S.current.strConnectionType,
                        child: _SegmentedChoice<String>(
                          value: _connection,
                          onChanged: (v) => setState(() => _connection = v),
                          options: [
                            _ChoiceOption(
                              value: 'cable',
                              label: S.current.strCable,
                              icon: Icons.cable_rounded,
                              helper: 'LAN',
                            ),
                            _ChoiceOption(
                              value: 'wlan',
                              label: S.current.strWiFi,
                              icon: Icons.wifi_rounded,
                              helper: 'WLAN',
                            ),
                          ],
                        ),
                      ),
                      if (_type == 'category') ...[
                        const SizedBox(height: 14),
                        _LabeledField(
                          label: S.current.strConnectedCategories,
                          helper:
                              'Shu kategoriyalar uchun buyurtmalar shu printerga yuboriladi',
                          child: _CategoryMultiSelect(
                            categories: widget.categories,
                            selected: _selectedCategoryIds,
                            onChanged: (id, selected) {
                              setState(() {
                                if (selected) {
                                  _selectedCategoryIds.add(id);
                                } else {
                                  _selectedCategoryIds.remove(id);
                                }
                              });
                            },
                          ),
                        ),
                      ],
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
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _DialogButton.ghost(
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

class _DialogHeader extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onClose;

  const _DialogHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Padding(
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
            child: Icon(icon, color: colors.buttonBrand, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
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
                  subtitle,
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
            onPressed: onClose,
            icon: Icon(Icons.close_rounded,
                size: 20, color: colors.iconSecondary),
            splashRadius: 18,
          ),
        ],
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
  final String? helper;
  final Widget child;
  const _LabeledField({required this.label, required this.child, this.helper});

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
        if (helper != null) ...[
          const SizedBox(height: 6),
          Text(
            helper!,
            style: TextStyle(
              fontSize: 11,
              color: colors.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ],
    );
  }
}

class _TextField extends StatelessWidget {
  final TextEditingController controller;
  final String? hint;
  final TextInputType? keyboard;
  final String? Function(String?)? validator;
  final List<TextInputFormatter>? formatters;

  const _TextField({
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

class _ChoiceOption<T> {
  final T value;
  final String label;
  final IconData icon;
  final String helper;
  const _ChoiceOption({
    required this.value,
    required this.label,
    required this.icon,
    required this.helper,
  });
}

class _SegmentedChoice<T> extends StatelessWidget {
  final T value;
  final List<_ChoiceOption<T>> options;
  final ValueChanged<T> onChanged;

  const _SegmentedChoice({
    required this.value,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Row(
      children: options.map((o) {
        final selected = o.value == value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
                right: o == options.last ? 0 : 10),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 160),
              decoration: BoxDecoration(
                color: selected
                    ? colors.buttonBrand.withOpacity(0.08)
                    : colors.bgSecondary,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selected ? colors.buttonBrand : colors.border,
                  width: selected ? 1.4 : 1,
                ),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => onChanged(o.value),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 11),
                    child: Row(
                      children: [
                        Icon(
                          o.icon,
                          size: 18,
                          color: selected
                              ? colors.buttonBrand
                              : colors.iconSecondary,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                o.label,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: selected
                                      ? colors.buttonBrand
                                      : colors.textDefault,
                                  fontFamily: 'Inter',
                                ),
                              ),
                              const SizedBox(height: 1),
                              Text(
                                o.helper,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: colors.textSecondary,
                                  fontFamily: 'Inter',
                                ),
                              ),
                            ],
                          ),
                        ),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: selected
                                ? colors.buttonBrand
                                : Colors.transparent,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: selected
                                  ? colors.buttonBrand
                                  : colors.border,
                              width: 1.5,
                            ),
                          ),
                          child: selected
                              ? const Icon(Icons.check_rounded,
                                  size: 11, color: Colors.white)
                              : null,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _CategoryMultiSelect extends StatelessWidget {
  final List<CategoryModel> categories;
  final Set<String> selected;
  final void Function(String id, bool selected) onChanged;

  const _CategoryMultiSelect({
    required this.categories,
    required this.selected,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    if (categories.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: colors.bgSecondary,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: colors.border),
        ),
        child: Text(
          'Kategoriyalar topilmadi',
          style: TextStyle(color: colors.textSecondary, fontFamily: 'Inter'),
        ),
      );
    }
    return Container(
      constraints: const BoxConstraints(maxHeight: 220),
      decoration: BoxDecoration(
        color: colors.bgSecondary,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: colors.border),
      ),
      padding: const EdgeInsets.all(10),
      child: SingleChildScrollView(
        child: Wrap(
          spacing: 8,
          runSpacing: 8,
          children: categories.map((c) {
            final isSelected = selected.contains(c.id);
            return _CategoryChip(
              label: c.name,
              selected: isSelected,
              onTap: () => onChanged(c.id, !isSelected),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return Material(
      color: selected ? colors.buttonBrand : colors.bgDefault,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: selected ? colors.buttonBrand : colors.border,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (selected) ...[
                Icon(Icons.check_rounded,
                    size: 14, color: colors.textOnBrand),
                const SizedBox(width: 5),
              ],
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: selected ? colors.textOnBrand : colors.textDefault,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
