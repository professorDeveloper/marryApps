import 'package:mary_ai_pos/core/constants/constants.dart';
import 'package:mary_ai_pos/core/services/cache/cache_service.dart';
import 'package:mary_ai_pos/core/services/local/local_order_store.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';
import 'package:mary_ai_pos/features/view/main/data/models/archive_detail/archive_detail_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/order_food/order_food_model.dart';

/// Lokal buyurtmani kassirning chek modeliga o'giradi.
///
/// Kerak bo'lish sababi: ofitsiant LAN orqali bergan buyurtma cloudga
/// yetguncha faqat `LocalOrderStore` da bo'ladi. To'lov ekrani esa
/// `ArchiveDetailEntity` bilan ishlaydi — usiz kassir stolni "band"
/// ko'radi-yu, chekni ocholmaydi va yopolmaydi.
///
/// `id` ataylab lokal buyurtmaniki: u klientda generatsiya qilingan va
/// cloudda ham xuddi shu bo'ladi, ya'ni to'lov so'rovi to'g'ri buyurtmaga
/// tushadi.
ArchiveDetailModel archiveDetailFromLocalOrder(
  LocalOrder order, {
  required CacheService cache,
}) {
  final cachedGoods = cache.getGoods();

  final goods = <OrderFoodModel>[];
  for (final item in order.items) {
    final goodId = item['good_id']?.toString() ?? '';
    final qty = (item['quantity'] as num?)?.toInt() ?? 0;
    if (goodId.isEmpty || qty <= 0) continue;

    final goodJson = cachedGoods.firstWhere(
      (g) => g['id'] == goodId,
      orElse: () => <String, dynamic>{},
    );
    final name = (item['name'] as String?)?.isNotEmpty == true
        ? item['name'] as String
        : (goodJson['name'] as String? ?? goodId);
    // Narx satr ham, raqam ham bo'lishi mumkin — manbaga qarab.
    final price = item['price'] != null
        ? asInt(item['price'])
        : asInt(goodJson['price']);

    goods.add(
      OrderFoodModel(
        // Qatorning klient id'si — takroriy yuborishda LAN server aynan
        // shu bo'yicha filtrlaydi, shuning uchun uni saqlaymiz.
        id: item['id']?.toString() ?? goodId,
        name: name,
        quantity: qty,
        price: price,
        comment: item['comment']?.toString() ?? '',
        status: 'pending',
        createdAt:
            DateTime.tryParse(item['created_at']?.toString() ?? '')?.toLocal(),
      ),
    );
  }

  final total = goods.fold<int>(0, (s, g) => s + g.price * g.quantity);

  return ArchiveDetailModel(
    id: order.id,
    status: OrderStatus.open,
    tableId: order.tableId,
    guestCount: order.guestCount.toDouble(),
    opened: order.clientCreatedAt,
    comment: order.comment ?? '',
    // Xizmat haqi va chegirma cloudda hisoblanadi; lokal chekda faqat
    // taomlar summasi bor. Uni "grand total" deb ko'rsatamiz — kassir
    // ko'rgan raqam kiritilgan naqd bilan solishtiriladigan raqam bo'lsin.
    foodTotal: total.toDouble(),
    grandTotal: total.toDouble(),
    goods: goods,
  );
}
