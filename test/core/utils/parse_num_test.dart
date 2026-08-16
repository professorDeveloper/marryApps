import 'package:flutter_test/flutter_test.dart';
import 'package:mary_ai_pos/core/utils/parse_num.dart';

// `asNum` cloud API narxlarni satr sifatida qaytargani uchun yozilgan
// (`"price": "45000"`). Shuning uchun asosiy e'tibor satr shakllariga.
void main() {
  group('asNum', () {
    test('null uchun fallback qaytaradi', () {
      expect(asNum(null), 0);
      expect(asNum(null, 7), 7);
    });

    test("num qiymatni o'zgarishsiz qaytaradi", () {
      expect(asNum(5), 5);
      expect(asNum(12.5), 12.5);
    });

    test("raqamli satrni o'giradi", () {
      expect(asNum('45000'), 45000);
      expect(asNum('12.5'), 12.5);
    });

    test("satr atrofidagi bo'shliqni tashlab yuboradi", () {
      expect(asNum('  45000  '), 45000);
    });

    test("bo'sh yoki raqam bo'lmagan satr uchun fallback", () {
      expect(asNum(''), 0);
      expect(asNum('   '), 0);
      expect(asNum('abc'), 0);
      expect(asNum('abc', -1), -1);
    });

    test('kutilmagan tip uchun fallback', () {
      expect(asNum(true), 0);
      expect(asNum(<int>[1], 3), 3);
    });
  });

  group('asInt', () {
    test('satrdan butun songa', () {
      expect(asInt('45000'), 45000);
    });

    test('kasr qismini kesadi', () {
      expect(asInt('12.9'), 12);
      expect(asInt(12.9), 12);
    });

    test('null uchun fallback', () {
      expect(asInt(null), 0);
      expect(asInt(null, 4), 4);
    });
  });
}
