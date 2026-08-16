import 'package:flutter_test/flutter_test.dart';
import 'package:mary_ai_pos/core/utils/uuid_v4.dart';

// UUID buyurtmaning doimiy identifikatori bo'lgani uchun shakli va
// takrorlanmasligi muhim — backend replay-return aynan shunga tayanadi.
void main() {
  group('UuidV4.generate', () {
    test("RFC 4122 shaklida bo'ladi", () {
      final re = RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
      );
      for (var i = 0; i < 200; i++) {
        expect(re.hasMatch(UuidV4.generate()), isTrue);
      }
    });

    test('versiya raqami 4', () {
      expect(UuidV4.generate()[14], '4');
    });

    test('variant bitlari RFC 4122 ga mos', () {
      expect(['8', '9', 'a', 'b'], contains(UuidV4.generate()[19]));
    });

    test('takrorlanmaydi', () {
      final set = <String>{};
      for (var i = 0; i < 1000; i++) {
        set.add(UuidV4.generate());
      }
      expect(set.length, 1000);
    });
  });
}
