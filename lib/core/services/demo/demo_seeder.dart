import 'package:flutter/foundation.dart';
import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/services/auth/offline_auth_cache.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/features/view/auth/data/models/user/user_model.dart';

/// Demo ma'lumot bilan lokal keshni to'ldiradi — bulutsiz to'liq oqimni
/// ko'rsatish uchun.
///
/// **Faqat `--dart-define=DEMO_SEED=true` bilan ishga tushadi.** Bayroqsiz
/// bu kod hech qachon chaqirilmaydi, shuning uchun productionga tasodifan
/// demo stollar tushib qolmaydi.
///
/// Ishlatish:
/// ```
/// flutter run -d macos --dart-define=DEMO_SEED=true
/// ```
///
/// Undan keyin ofitsiant ilovasidan `demo` brand va `2255` PIN bilan kiriladi.
class DemoSeeder {
  /// Kompilyatsiya vaqtida hal bo'ladi — bayroqsiz build'da bu shox
  /// umuman qolmaydi.
  static const bool isEnabled = bool.fromEnvironment('DEMO_SEED');

  static const String brandId = 'demo';
  static const String pincode = '2255';

  static const _hallId = '11111111-1111-4111-8111-111111111111';
  static const _branchId = '22222222-2222-4222-8222-222222222222';

  /// Keshda allaqachon haqiqiy ma'lumot bo'lsa uni buzmaydi.
  static Future<void> seed({
    required CacheService cache,
    required OfflineAuthCache authCache,
  }) async {
    if (!isEnabled) return;

    if (cache.getGoods().isNotEmpty && cache.getHalls().isNotEmpty) {
      debugPrint('[DemoSeeder] kesh to\'la — demo ma\'lumot qo\'shilmadi');
      return;
    }

    await cache.saveHalls([
      {
        'id': _hallId,
        'branch_id': _branchId,
        'name': 'Asosiy zal',
        'width': 1000.0,
        'height': 700.0,
      },
    ]);

    await cache.saveTables([
      for (var i = 1; i <= 8; i++)
        {
          'id': _tableId(i),
          'hall_id': _hallId,
          'number': i,
          'capacity': i.isEven ? 4 : 2,
          'pos_x': ((i - 1) % 4) * 220.0 + 60,
          'pos_y': ((i - 1) ~/ 4) * 200.0 + 60,
          'width': 140.0,
          'height': 140.0,
          'rotation': 0.0,
          'status': 'free',
          'shape': 'rectangle',
        },
    ]);

    await cache.saveCategories([
      for (final c in _categories)
        {
          'id': c.$1,
          'name': c.$2,
          'colorCode': c.$3,
        },
    ]);

    await cache.saveGoods([
      for (final g in _goods)
        {
          'id': g.$1,
          'name': g.$2,
          'category_id': g.$3,
          'price': g.$4.toString(),
          'cost_price': (g.$4 * 0.4).round().toString(),
          'profit': (g.$4 * 0.6).round().toString(),
          'profit_margin': '60',
          'cook_time': 10,
          'description': '',
          'department_id': '',
        },
    ]);

    // Ofitsiant LAN orqali shu PIN bilan kiradi. `getForPin` aynan shu
    // `${brandId}_$pincode` kalitidan o'qiydi.
    await authCache.saveForPin(
      brandId: brandId,
      pincode: pincode,
      user: const UserModel(
        id: '33333333-3333-4333-8333-333333333333',
        fullName: 'Xasan',
        username: 'xasan',
        role: UserRole.waiter,
        isActive: true,
        brandId: brandId,
        branchId: _branchId,
      ),
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token',
    );

    debugPrint(
      '[DemoSeeder] tayyor — brand "$brandId", PIN "$pincode", '
      '${_goods.length} taom, 8 stol',
    );
  }

  static String _tableId(int i) =>
      '44444444-4444-4444-8444-${i.toString().padLeft(12, '0')}';

  static const _catHot = '55555555-5555-4555-8555-000000000001';
  static const _catCold = '55555555-5555-4555-8555-000000000002';
  static const _catDrink = '55555555-5555-4555-8555-000000000003';

  /// (id, nom, rang)
  static const List<(String, String, String)> _categories = [
    (_catHot, 'Issiq taomlar', '#FF8956'),
    (_catCold, 'Salatlar', '#4ADE80'),
    (_catDrink, 'Ichimliklar', '#FBBF24'),
  ];

  /// (id, nom, kategoriya, narx)
  static const List<(String, String, String, int)> _goods = [
    ('66666666-0000-4000-8000-000000000001', 'Osh', _catHot, 45000),
    ('66666666-0000-4000-8000-000000000002', 'Lag\'mon', _catHot, 42000),
    ('66666666-0000-4000-8000-000000000003', 'Shashlik', _catHot, 38000),
    ('66666666-0000-4000-8000-000000000004', 'Manti', _catHot, 40000),
    ('66666666-0000-4000-8000-000000000005', 'Norin', _catHot, 44000),
    ('66666666-0000-4000-8000-000000000006', 'Achichuk', _catCold, 15000),
    ('66666666-0000-4000-8000-000000000007', 'Sezar', _catCold, 35000),
    ('66666666-0000-4000-8000-000000000008', 'Vinegret', _catCold, 18000),
    ('66666666-0000-4000-8000-000000000009', 'Choy', _catDrink, 8000),
    ('66666666-0000-4000-8000-000000000010', 'Kola', _catDrink, 12000),
    ('66666666-0000-4000-8000-000000000011', 'Ayron', _catDrink, 10000),
    ('66666666-0000-4000-8000-000000000012', 'Suv', _catDrink, 5000),
  ];
}
