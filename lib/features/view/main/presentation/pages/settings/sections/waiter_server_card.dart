import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mary_ai_pos/core/extension/for_context.dart';
import 'package:mary_ai_pos/core/services/lan/lan_discovery.dart';
import 'package:mary_ai_pos/core/services/lan/lan_server_service.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/services/offline_queue/offline_queue_service.dart';
import 'package:mary_ai_pos/di.dart';
import 'package:mary_ai_pos/features/view/main/presentation/pages/settings/widgets/section_shell.dart';

/// Ofitsiant ilovalari uchun LAN serverni boshqarish.
///
/// Bu POS'ni restoran uchun hub'ga aylantiradi: ofitsiant planshetlari
/// menyuni, stollarni va buyurtmalarni shu yerdan oladi — internet
/// bor-yo'qligidan qat'i nazar.
class WaiterServerCard extends StatefulWidget {
  const WaiterServerCard({super.key});

  @override
  State<WaiterServerCard> createState() => _WaiterServerCardState();
}

class _WaiterServerCardState extends State<WaiterServerCard> {
  Timer? _refreshTimer;
  List<String> _localIps = const [];
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _loadIps();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 3),
      (_) => mounted ? setState(() {}) : null,
    );
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadIps() async {
    try {
      final ifaces = await NetworkInterface.list(
        type: InternetAddressType.IPv4,
        includeLinkLocal: false,
        includeLoopback: false,
      );
      if (!mounted) return;
      setState(() {
        _localIps = [
          for (final i in ifaces)
            for (final a in i.addresses) a.address,
        ];
      });
    } catch (_) {
      // Interfeyslarni o'qib bo'lmadi — manzil ko'rsatilmaydi, xolos.
    }
  }

  Future<void> _toggle(bool value) async {
    setState(() => _busy = true);
    await inject<LanServerService>().setEnabled(value);
    if (!mounted) return;
    setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    final service = inject<LanServerService>();
    final store = inject<LocalOrderStore>();
    final colors = context.colors;
    final status = service.status;
    final deadLetters = store.deadLetters();
    // Eski offline navbatdan server rad etgan operatsiyalar ham shu yerda
    // ko'rsatiladi — ular ilgari jimgina o'chirilardi.
    final legacyFailed = inject<OfflineQueueService>().failedCount;

    return Column(
      children: [
        SoftCard(
          padding: const EdgeInsets.all(18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: colors.buttonBrand.withOpacity(0.10),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      Icons.tablet_android,
                      color: colors.buttonBrand,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Ofitsiant ilovasi',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: colors.textDefault,
                            fontFamily: 'Inter',
                          ),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          'Planshetlar shu kompyuterga ulanadi. '
                          'Internet kerak emas — bitta WiFi yetarli.',
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
                  if (_busy)
                    const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  else
                    Switch(value: status.enabled, onChanged: _toggle),
                ],
              ),
              if (status.enabled) ...[
                const SizedBox(height: 16),
                Divider(color: colors.border, height: 1),
                const SizedBox(height: 16),
                if (status.error != null) ...[
                  _errorBanner(colors, status.error!),
                  const SizedBox(height: 14),
                ],
                _statusRow(colors, status),
                if (_localIps.isNotEmpty) ...[
                  const SizedBox(height: 14),
                  _addressBlock(colors, status.port),
                ],
              ],
            ],
          ),
        ),

        // Cloudga yetmagan buyurtmalar. Bu blok jimgina yashirilmaydi —
        // yo'qolgan sotuv kassir ko'radigan narsa bo'lishi shart.
        if (deadLetters.isNotEmpty || legacyFailed > 0) ...[
          const SizedBox(height: 14),
          _deadLetterCard(colors, deadLetters, legacyFailed),
        ],
      ],
    );
  }

  /// Server ko'tarilmaganda sababini ko'rsatadi. Busiz tugma yoqilgandek
  /// turadi va ofitsiantlar nega ulanolmayotgani noma'lum qoladi.
  Widget _errorBanner(dynamic colors, String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.10),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.red.withOpacity(0.30)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, color: Colors.red, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Server ishga tushmadi — $message',
              style: const TextStyle(
                fontSize: 12.5,
                color: Colors.red,
                fontFamily: 'Inter',
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusRow(dynamic colors, LanServerStatus status) {
    return Row(
      children: [
        _stat(
          colors,
          status.running ? 'Ishlamoqda' : 'To\'xtagan',
          'Holat',
          status.running ? Colors.green : Colors.red,
        ),
        _stat(colors, '${status.connectedWaiters}', 'Ulangan planshet', null),
        _stat(
          colors,
          '${status.pendingSync}',
          'Yuborilmagan',
          status.pendingSync > 0 ? Colors.orange : null,
        ),
      ],
    );
  }

  Widget _stat(dynamic colors, String value, String label, Color? accent) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: accent ?? colors.textDefault,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              color: colors.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }

  /// Planshetda avtomatik topilmasa ofitsiant shu manzilni qo'lda kiritadi.
  Widget _addressBlock(dynamic colors, int port) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'PLANSHETDA KIRITISH UCHUN MANZIL',
          style: TextStyle(
            fontSize: 10,
            letterSpacing: 1.2,
            fontWeight: FontWeight.w600,
            color: colors.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final ip in _localIps)
              InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: '$ip:$port'));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Nusxalandi')),
                  );
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: colors.bgSecondary,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: colors.border),
                  ),
                  child: Text(
                    '$ip:$port',
                    style: TextStyle(
                      fontSize: 13,
                      color: colors.textDefault,
                      fontFamily: 'JetBrainsMono',
                    ),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Windows Firewall $port (TCP) va $kDiscoveryPort (UDP) '
          'portlarga ruxsat berishi kerak.',
          style: TextStyle(
            fontSize: 11,
            color: colors.textSecondary,
            fontFamily: 'Inter',
          ),
        ),
      ],
    );
  }

  Widget _deadLetterCard(
    dynamic colors,
    List<LocalOrder> deadLetters,
    int legacyFailed,
  ) {
    final total = deadLetters.length + legacyFailed;
    return SoftCard(
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 22),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$total ta buyurtma serverga o\'tmadi',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: colors.textDefault,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Bu buyurtmalar qurilmada saqlanib turibdi va o\'chirilmaydi. '
            'Ularni qo\'lda kiritish yoki texnik yordamga murojaat qilish kerak.',
            style: TextStyle(
              fontSize: 12,
              color: colors.textSecondary,
              fontFamily: 'Inter',
            ),
          ),
          const SizedBox(height: 12),
          for (final order in deadLetters.take(5))
            Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Text(
                '• ${order.items.length} ta taom · '
                '${order.clientCreatedAt.hour.toString().padLeft(2, '0')}:'
                '${order.clientCreatedAt.minute.toString().padLeft(2, '0')} · '
                '${order.lastError ?? ''}',
                style: TextStyle(
                  fontSize: 11,
                  color: colors.textSecondary,
                  fontFamily: 'JetBrainsMono',
                ),
              ),
            ),
        ],
      ),
    );
  }
}
