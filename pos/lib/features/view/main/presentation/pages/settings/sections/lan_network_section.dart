import 'dart:async';

import 'package:flutter/material.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/services/lan_hub/lan_hub_service.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/sections/waiter_server_card.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/widgets/section_shell.dart';
import 'package:mary_ai_pos/generated/l10n.dart';

class LanNetworkSection extends StatefulWidget {
  const LanNetworkSection({super.key});

  @override
  State<LanNetworkSection> createState() => _LanNetworkSectionState();
}

class _LanNetworkSectionState extends State<LanNetworkSection> {
  late LanMode _mode;
  late String _serverIp;
  final _ipController = TextEditingController();
  Timer? _refreshTimer;

  @override
  void initState() {
    super.initState();
    final lanHub = inject<LanHubService>();
    _mode = lanHub.mode;
    _serverIp = lanHub.serverIp;
    _ipController.text = _serverIp;
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) => setState(() {}),
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    _ipController.dispose();
    super.dispose();
  }

  Future<void> _onModeChanged(LanMode mode) async {
    final lanHub = inject<LanHubService>();
    await lanHub.setMode(mode);
    await lanHub.restart();
    setState(() => _mode = mode);
  }

  Future<void> _onIpSaved() async {
    final ip = _ipController.text.trim();
    if (ip.isEmpty) return;
    final lanHub = inject<LanHubService>();
    await lanHub.setServerIp(ip);
    await lanHub.restart();
    setState(() => _serverIp = ip);
  }

  @override
  Widget build(BuildContext context) {
    final lanHub = inject<LanHubService>();
    final colors = context.colors;

    return SectionShell(
      title: S.current.strNetworkLAN,
      subtitle: S.current.strDeviceSynchronization,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _SettingCard(
            icon: Icons.router_outlined,
            title: S.current.strMode,
            subtitle: S.current.strModeDescription,
            control: _SegmentedPicker<LanMode>(
              value: _mode,
              options: [
                _Option(
                  value: LanMode.disabled,
                  label: S.current.strDisabled,
                ),
                _Option(value: LanMode.server, label: S.current.strHub),
                _Option(value: LanMode.client, label: S.current.strClient),
              ],
              onChanged: _onModeChanged,
            ),
          ),
          if (_mode == LanMode.client) ...[
            const SizedBox(height: 14),
            _IpInputCard(
              controller: _ipController,
              onSave: _onIpSaved,
            ),
          ],
          const SizedBox(height: 14),
          _StatusCard(
            mode: _mode,
            clientCount: _mode == LanMode.server ? lanHub.clientCount : null,
            isConnected:
                _mode == LanMode.client ? lanHub.isClientConnected : null,
            colors: colors,
          ),
          const SizedBox(height: 14),
          _InfoCard(mode: _mode),
          const SizedBox(height: 14),
          const WaiterServerCard(),
        ],
      ),
    );
  }
}

class _IpInputCard extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSave;

  const _IpInputCard({required this.controller, required this.onSave});

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: colors.buttonBrand.withOpacity(0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.lan_outlined, color: colors.buttonBrand, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hub IP manzili',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colors.textDefault,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Hub (server) qurilmaning IP manzili',
                  style: TextStyle(
                    fontSize: 12,
                    color: colors.textSecondary,
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 180,
            child: TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              style: TextStyle(
                fontSize: 14,
                fontFamily: 'Inter',
                color: colors.textDefault,
              ),
              decoration: InputDecoration(
                hintText: '192.168.1.100',
                hintStyle: TextStyle(
                  fontSize: 13,
                  color: colors.textSecondary,
                  fontFamily: 'Inter',
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
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
                  borderSide:
                      BorderSide(color: colors.buttonBrand, width: 1.5),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: colors.buttonBrand,
            borderRadius: BorderRadius.circular(10),
            child: InkWell(
              borderRadius: BorderRadius.circular(10),
              onTap: onSave,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 10,
                ),
                child: Text(
                  'Saqlash',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: colors.textOnBrand,
                    fontFamily: 'Inter',
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

class _StatusCard extends StatelessWidget {
  final LanMode mode;
  final int? clientCount;
  final bool? isConnected;
  final dynamic colors;

  const _StatusCard({
    required this.mode,
    required this.clientCount,
    required this.isConnected,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    String statusText;
    Color statusColor;
    IconData statusIcon;

    switch (mode) {
      case LanMode.server:
        final count = clientCount ?? 0;
        statusText = count == 0
            ? 'Kutilmoqda — hech qanday qurilma ulanmagan'
            : '$count ta qurilma ulangan';
        statusColor = count > 0 ? c.systemSuccess : c.textSecondary;
        statusIcon = count > 0
            ? Icons.check_circle_outline
            : Icons.radio_button_unchecked;
        break;
      case LanMode.client:
        final connected = isConnected ?? false;
        statusText = connected ? 'Hub ga ulangan' : 'Ulanmadi — qayta urinmoqda...';
        statusColor = connected ? c.systemSuccess : c.systemError;
        statusIcon = connected
            ? Icons.check_circle_outline
            : Icons.error_outline;
        break;
      case LanMode.disabled:
        statusText = 'LAN sinxronizatsiya o\'chirilgan';
        statusColor = c.textSecondary;
        statusIcon = Icons.radio_button_unchecked;
        break;
    }

    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(statusIcon, color: statusColor, size: 22),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Ulanish holati',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: c.textDefault,
                  fontFamily: 'Inter',
                ),
              ),
              const SizedBox(height: 3),
              Text(
                statusText,
                style: TextStyle(
                  fontSize: 12,
                  color: statusColor,
                  fontFamily: 'Inter',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final LanMode mode;
  const _InfoCard({required this.mode});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final text = switch (mode) {
      LanMode.server =>
        'Bu qurilma Hub sifatida ishlaydi. Boshqa POS qurilmalari uning IP manziliga ulanadi. '
            'IP manzilni "Tarmoq sozlamalari" dan tekshiring.',
      LanMode.client =>
        'Bu qurilma Client sifatida ishlaydi. Hub (server) qurilmaning IP manzilini kiriting va "Saqlash" ni bosing.',
      LanMode.disabled =>
        'LAN sinxronizatsiya o\'chirilgan. Internet bo\'lganda faqat bulut orqali sinxronlashadi.',
    };

    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: c.buttonBrand.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.info_outline, color: c.buttonBrand, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: c.textSecondary,
                fontFamily: 'Inter',
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Option<T> {
  final T value;
  final String label;
  final String? flag;
  const _Option({required this.value, required this.label, this.flag});
}

class _SegmentedPicker<T> extends StatelessWidget {
  final T value;
  final List<_Option<T>> options;
  final ValueChanged<T> onChanged;

  const _SegmentedPicker({
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
        mainAxisSize: MainAxisSize.min,
        children: options.map((o) {
          final selected = o.value == value;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            curve: Curves.easeOutCubic,
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
                    horizontal: 14,
                    vertical: 8,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (o.flag != null) ...[
                        Text(o.flag!, style: const TextStyle(fontSize: 14)),
                        const SizedBox(width: 6),
                      ],
                      Text(
                        o.label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: selected
                              ? colors.buttonBrand
                              : colors.textSecondary,
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
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

class _SettingCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget control;

  const _SettingCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.control,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: colors.buttonBrand.withOpacity(0.10),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: colors.buttonBrand, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colors.textDefault,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 3),
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
          const SizedBox(width: 16),
          control,
        ],
      ),
    );
  }
}
