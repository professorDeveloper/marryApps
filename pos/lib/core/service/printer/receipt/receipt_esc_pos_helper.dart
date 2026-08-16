import 'dart:convert';
import 'dart:typed_data';

import 'package:charset/charset.dart' show cp866;
import 'package:esc_pos_utils_plus/esc_pos_utils_plus.dart';
import 'package:windows1251/windows1251.dart';

/// Thermal printerda kirill: yuboriladigan **baytlar** bilan `ESC t` (kod jadvali)
/// bir-biriga mos bo‘lishi kerak. Aks holda «tushunarsiz belgilar» chiqadi.
///
/// - **cp866** — ko‘p arzon ESC/POS (Xprinter, Goojprt va h.k.): odatda zavod
///   «PC866 / Cyrillic»; `capabilities.json` `default` profilda `CP866` → id **17**.
/// - **cp1251** — Epson, Star, ba‘zi Sunmi: `CP1251` → id **46**, Windows-1251 baytlari.
///
/// Printer `ESC t` buyrug‘ini **e’tiborsiz** qoldirsa ham, agar uning jadvali
/// CP866 bo‘lsa, 1251 baytlari baribir noto‘g‘ri ko‘rinadi — shu holda `cp866` tanlang.
enum ReceiptCyrillicEncoding { cp866, cp1251 }

/// Chekda noto‘g‘ri kirill bo‘lsa, `cp866` qilib sinang. Allaqachon to‘g‘ri 1251
/// chiqayotgan bo‘lsa, `cp1251` qoldiring.
const ReceiptCyrillicEncoding kReceiptCyrillicEncoding =
    ReceiptCyrillicEncoding.cp866;

String get receiptEscPosCodePageName => switch (kReceiptCyrillicEncoding) {
      ReceiptCyrillicEncoding.cp866 => 'CP866',
      ReceiptCyrillicEncoding.cp1251 => 'CP1251',
    };

Codec<String, List<int>> get _receiptTextCodec =>
    switch (kReceiptCyrillicEncoding) {
      ReceiptCyrillicEncoding.cp866 => const Cp866ReceiptCodec(),
      ReceiptCyrillicEncoding.cp1251 =>
        const Windows1251Codec(allowInvalid: true),
    };

/// CP866 jadvalida yo‘q belgilar (masalan, ba‘zi o‘zbek maxsus harflar) `?` ga almashtiriladi.
final class Cp866ReceiptCodec extends Codec<String, List<int>> {
  const Cp866ReceiptCodec();

  @override
  Converter<String, List<int>> get encoder => const _Cp866ReceiptEncoder();

  @override
  Converter<List<int>, String> get decoder => cp866.decoder;
}

final class _Cp866ReceiptEncoder extends Converter<String, List<int>> {
  const _Cp866ReceiptEncoder();

  @override
  Uint8List convert(String input) =>
      cp866.encode(input, invalidCharacter: 0x3F);
}

Generator receiptGenerator(PaperSize paperSize, CapabilityProfile profile) {
  return Generator(
    paperSize,
    profile,
    codec: _receiptTextCodec,
  );
}

/// Har bir chek boshida: **ESC @** (printerni default holatga), so‘ng kod jadvali.
/// Raster/logo oldidan holat tozalangan bo‘lmasa, ba’zi modellar keyingi baytlarni matn deb chop etadi.
List<int> receiptEncodingPreamble(Generator gen) => [
      0x1B,
      0x40,
      ...gen.setGlobalCodeTable(receiptEscPosCodePageName),
    ];
