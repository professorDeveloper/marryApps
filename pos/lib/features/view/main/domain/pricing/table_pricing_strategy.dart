import 'package:mary_ai_pos/features/view/main/data/models/open_order/open_order_model.dart';
import 'package:mary_ai_pos/features/view/main/data/models/table_timer/table_timer_response_model.dart';

/// Stol uchun qo'shimcha to'lov siyosati.
///
/// Order ustidagi taomlar narxidan tashqari qo'shiladigan summa (masalan
/// soatlik to'lov yoki muzlatilgan vaqt to'lovi) shu interfeys orqali olinadi.
/// Bu kassirning total hisoblash logikasini stol turidan ajratadi va yangi
/// turlarni qo'shganda asosiy widget kodi o'zgarmaydi.
abstract class TablePricingStrategy {
  const TablePricingStrategy();

  /// Taomlar ustiga qo'shiladigan extra summa (so'm).
  int get extraCharge;

  /// Vaqt o'tishi bilan yangi pul yig'ilib boradimi.
  /// `true` bo'lsa UI har sekundda yangilanadi.
  bool get isAccruing;

  /// Pricing terminal yopiq holatdami (transfer-after-freeze).
  bool get isFrozen;
}

/// Oddiy stol: vaqt asosida qo'shimcha to'lov yo'q.
class SimpleTablePricing extends TablePricingStrategy {
  const SimpleTablePricing();

  @override
  int get extraCharge => 0;

  @override
  bool get isAccruing => false;

  @override
  bool get isFrozen => false;
}

/// Time-based stol — timer hozir ishlayotgan yoki to'xtatilgan (lekin yopilmagan).
/// Joriy summani live ko'rsatadi (tick-by-tick yangilanadi).
class TimeBasedAccruingPricing extends TablePricingStrategy {
  final TableTimerResponse timer;
  final int displayActiveSec;

  const TimeBasedAccruingPricing({
    required this.timer,
    required this.displayActiveSec,
  });

  @override
  int get extraCharge {
    final price = double.tryParse(timer.pricePerHour ?? '') ?? 0;
    // Running paytda lokal hisoblangan summa — UI har sekundda yangilanishi
    // uchun. Server `currentAmount` 60s sync orasida muzlab qoladi.
    if (timer.stateNormalized == 'running' && price > 0) {
      return ((displayActiveSec / 3600.0) * price).round();
    }
    // Paused/closed — server qaytargan summa avtoritar.
    final fromApi = parseAmountToInt(timer.currentAmount);
    if (fromApi > 0) return fromApi;
    if (price == 0) return 0;
    return ((displayActiveSec / 3600.0) * price).round();
  }

  @override
  bool get isAccruing => timer.stateNormalized == 'running';

  @override
  bool get isFrozen => false;
}

/// Muzlatilgan vaqt to'lovi — time-based stol simple stolga o'tkazilgan.
/// Yangi vaqt hisoblanmaydi; serverda saqlangan summa ishlatiladi.
class FrozenTimePricing extends TablePricingStrategy {
  /// Muzlatilgan summa (so'm).
  final int frozenAmount;

  /// Muzlatilgan davom etish vaqti (sek). UI'da ko'rsatish uchun.
  final int frozenActiveSec;

  const FrozenTimePricing({
    required this.frozenAmount,
    this.frozenActiveSec = 0,
  });

  @override
  int get extraCharge => frozenAmount;

  @override
  bool get isAccruing => false;

  @override
  bool get isFrozen => true;
}

/// Joriy holatga qarab to'g'ri strategiyani tanlaydi.
///
/// Tartib:
/// 1. Timer mavjud va `state == closed` + `final_amount` bo'lsa → FrozenTime.
/// 2. Order time-based bo'lmasa-yu `table_amount > 0` bo'lsa → FrozenTime.
///    (Bu app restart yoki order qayta ochilganda timer endpoint chaqirilmasa
///    ham frozen state-ni tiklash imkonini beradi.)
/// 3. Timer mavjud va time-based bo'lsa → TimeBasedAccruing.
/// 4. Aks holda → Simple.
class TablePricingResolver {
  const TablePricingResolver._();

  static TablePricingStrategy resolve({
    required OpenOrderModel? order,
    required TableTimerResponse? timer,
    required int displayActiveSec,
  }) {
    if (timer != null &&
        timer.isFrozenClosed &&
        parseAmountToInt(timer.finalAmount) > 0) {
      return FrozenTimePricing(
        frozenAmount: parseAmountToInt(timer.finalAmount),
        frozenActiveSec: timer.totalActiveSec,
      );
    }

    if (order != null &&
        !order.isTimeBasedTable &&
        order.hasFrozenTableAmount) {
      return FrozenTimePricing(
        frozenAmount: order.tableAmountInt,
        frozenActiveSec: timer?.totalActiveSec ?? 0,
      );
    }

    if (timer != null && timer.isTimeBasedTable) {
      return TimeBasedAccruingPricing(
        timer: timer,
        displayActiveSec: displayActiveSec,
      );
    }

    return const SimpleTablePricing();
  }
}
