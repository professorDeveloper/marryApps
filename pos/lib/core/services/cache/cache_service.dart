import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mary_ai_pos/core/api/dio_client.dart';
import 'package:mary_ai_pos/core/api/list_api.dart';

class CacheService {
  static const _categories = 'cache_categories';
  static const _goods = 'cache_goods';
  static const _halls = 'cache_halls';
  static const _tables = 'cache_tables';
  static const _orderDetailPrefix = 'cache_order_detail:';

  late final Box _box;

  CacheService(this._box);

  static Future<CacheService> init() async {
    final box = await Hive.openBox('pos_cache');
    return CacheService(box);
  }

  // ─── Categories ───────────────────────────────────────────────
  Future<void> saveCategories(List<Map<String, dynamic>> items) async =>
      _box.put(_categories, jsonEncode(items));

  List<Map<String, dynamic>> getCategories() => _decode(_box.get(_categories));

  // ─── Goods ────────────────────────────────────────────────────
  Future<void> saveGoods(List<Map<String, dynamic>> items) async =>
      _box.put(_goods, jsonEncode(items));

  List<Map<String, dynamic>> getGoods() => _decode(_box.get(_goods));

  // ─── Halls ────────────────────────────────────────────────────
  Future<void> saveHalls(List<Map<String, dynamic>> items) async =>
      _box.put(_halls, jsonEncode(items));

  List<Map<String, dynamic>> getHalls() => _decode(_box.get(_halls));

  // ─── Tables ───────────────────────────────────────────────────
  Future<void> saveTables(List<Map<String, dynamic>> items) async =>
      _box.put(_tables, jsonEncode(items));

  List<Map<String, dynamic>> getTables() => _decode(_box.get(_tables));

  // ─── Order Detail ─────────────────────────────────────────────
  Future<void> saveOrderDetail(String tableId, Map<String, dynamic> json) async =>
      _box.put('$_orderDetailPrefix$tableId', jsonEncode(json));

  Map<String, dynamic>? getOrderDetail(String tableId) {
    final raw = _box.get('$_orderDetailPrefix$tableId');
    if (raw == null) return null;
    try {
      return jsonDecode(raw as String) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Transfer yoki checkout keyin stol cache-ni o'chiradi.
  /// Keyingi `fetchBillOrders` chaqiruvi throttle'ni chetlab o'tib
  /// serverdan yangi ma'lumot oladi.
  Future<void> evictOrderDetail(String tableId) async {
    await _box.delete('$_orderDetailPrefix$tableId');
  }

  // ─── Order Item Timestamps ────────────────────────────────────
  // `name -> earliestCreatedAt` map'i orderId bo'yicha cache'lanadi.
  // Offline'da bill ekrani ochilganda ham vaqtlar ko'rinishi uchun.
  static const _itemTsPrefix = 'cache_order_item_ts:';

  Future<void> saveItemTimestamps(
    String orderId,
    Map<String, DateTime> ts,
  ) async {
    if (ts.isEmpty) return;
    final encoded = ts.map((k, v) => MapEntry(k, v.toIso8601String()));
    await _box.put('$_itemTsPrefix$orderId', jsonEncode(encoded));
  }

  Map<String, DateTime> getItemTimestamps(String orderId) {
    final raw = _box.get('$_itemTsPrefix$orderId');
    if (raw == null) return const {};
    try {
      final map = jsonDecode(raw as String) as Map<String, dynamic>;
      final out = <String, DateTime>{};
      map.forEach((k, v) {
        if (v is String && v.isNotEmpty) {
          final dt = DateTime.tryParse(v);
          if (dt != null) out[k] = dt.toLocal();
        }
      });
      return out;
    } catch (_) {
      return const {};
    }
  }

  static const _goodsFetchedAt = 'cache_goods_fetched_at';
  static const _goodsStale = Duration(minutes: 30);

  // In-memory flag: prevents concurrent fetches within a single app session
  static bool _isFetchingGoods = false;

  bool isGoodsFresh() {
    final raw = _box.get(_goodsFetchedAt) as String?;
    if (raw == null) return false;
    final ts = DateTime.tryParse(raw);
    if (ts == null) return false;
    return DateTime.now().difference(ts) < _goodsStale;
  }

  /// Barcha goodslarni pagination bilan orqa fonda yuklab saqlab qo'yadi.
  /// Har bir batch 500 ta; bo'sh javob kelsa yoki batchdan kam javob kelsa to'xtaydi.
  /// [force] = true bo'lsa throttle tekshirilmaydi.
  Future<void> prefetchAllGoods(DioClient client, {bool force = false}) async {
    if (!force && isGoodsFresh()) return;
    if (_isFetchingGoods) return;
    _isFetchingGoods = true;
    const batchSize = 500;
    int offset = 0;
    final all = <Map<String, dynamic>>[];
    try {
      while (true) {
        final res = await client.get(
          ListAPI.goodsPaginated(limit: batchSize, offset: offset),
        );
        final data = res.data['data'];
        final List<dynamic> items = data is List
            ? data
            : (data is Map ? (data['data'] as List? ?? []) : []);
        if (items.isEmpty) break;
        all.addAll(items.cast<Map<String, dynamic>>());
        if (items.length < batchSize) break;
        offset += batchSize;
      }
      if (all.isNotEmpty) {
        await saveGoods(all);
        await _box.put(_goodsFetchedAt, DateTime.now().toIso8601String());
      }
    } catch (e) {
      if (kDebugMode) debugPrint('[CacheService] prefetchAllGoods: $e');
    } finally {
      _isFetchingGoods = false;
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────
  List<Map<String, dynamic>> _decode(dynamic raw) {
    if (raw == null) return [];
    try {
      final list = jsonDecode(raw as String) as List;
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }
}
