import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import 'printer_config.dart';
import 'printer_setting_entry.dart';

/// Backend `GET /api/v1/settings/printer-settings` ro‘yxati; [SyncPrinterSettingsUsecase] yozadi.
class PrinterConfigStorage {
  PrinterConfigStorage(this._prefs);

  final SharedPreferences _prefs;

  static const _jsonKey = 'printer_settings_entries_v2_json';

  static const defaultPort = 9100;
  static const fallbackCloseCheckIp = '192.168.1.222';

  Future<void> applyPrinterSettingsList(List<PrinterSettingEntry> list) async {
    await _prefs.setString(_jsonKey, PrinterSettingEntry.encodeList(list));
  }

  List<PrinterSettingEntry> _entries() {
    final s = _prefs.getString(_jsonKey);
    if (s == null || s.isEmpty) return [];
    try {
      final decoded = jsonDecode(s) as List<dynamic>;
      return decoded
          .map(
            (e) => PrinterSettingEntry.fromJson(
              Map<String, dynamic>.from(e as Map),
            ),
          )
          .toList();
    } catch (_) {
      return [];
    }
  }

  /// `GET printer-settings` muvaffaqiyatli yozilgan bo‘lsa `true` (bo‘sh ro‘yxat ham `true`).
  bool get hasPrinterSettingsEntries => _entries().isNotEmpty;

  /// `type: close_check` — to‘lov / smena yopish cheklari.
  PrinterConfig? getCloseCheckPrinter() {
    for (final e in _entries()) {
      if (e.isCloseCheck && e.ip.isNotEmpty && e.port > 0) {
        return PrinterConfig(
          ip: e.ip,
          port: e.port,
          connectionType: e.connectionType,
        );
      }
    }
    return null;
  }

  PrinterConfig closeCheckConfigOrFallback() =>
      getCloseCheckPrinter() ??
      const PrinterConfig(ip: fallbackCloseCheckIp, port: defaultPort);

  /// Oshxona: `type=category` va `connected_entity_ids` ichida [categoryId] yoki [goodId] mos kelganda.
  /// Mos yozuv yo‘q bo‘lsa `null` — boshqa printerga «tushirish» qilinmaydi.
  PrinterConfig? categoryPrinterForOrNull(
    String categoryId, {
    String? goodId,
  }) {
    final wantCat = categoryId.trim();
    final wantGood = goodId?.trim() ?? '';
    if (wantCat.isEmpty && wantGood.isEmpty) return null;

    final list = _entries();
    if (wantCat.isNotEmpty) {
      for (final e in list) {
        if (!e.isCategory || e.ip.isEmpty || e.port <= 0) continue;
        for (final cid in e.connectedEntityIds) {
          if (_idEq(cid, wantCat)) {
            return PrinterConfig(
              ip: e.ip,
              port: e.port,
              connectionType: e.connectionType,
            );
          }
        }
      }
    }
    if (wantGood.isNotEmpty) {
      for (final e in list) {
        if (!e.isCategory || e.ip.isEmpty || e.port <= 0) continue;
        for (final cid in e.connectedEntityIds) {
          if (_idEq(cid, wantGood)) {
            return PrinterConfig(
              ip: e.ip,
              port: e.port,
              connectionType: e.connectionType,
            );
          }
        }
      }
    }
    return null;
  }

  bool _idEq(String a, String b) =>
      a.trim().toLowerCase() == b.trim().toLowerCase();
}
