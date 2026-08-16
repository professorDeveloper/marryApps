import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Sinov muddati qorovuli — ilova birinchi ishga tushgan paytdan boshlab
/// belgilangan vaqt o'tgach o'zini qulflaydi.
///
/// **Internetga bog'liq emas.** Hamma hisob lokal: demo qurilma umuman
/// tarmoqsiz ishlatilsa ham muddat o'tadi. Serverdan tasdiq so'ralmaydi —
/// aks holda internetni o'chirib qo'yish qulfni cheksiz kechiktirardi.
///
/// Muddat va aloqa matni yig'ish paytida beriladi:
/// ```
/// flutter build windows --dart-define=TRIAL_HOURS=36 \
///   --dart-define=TRIAL_CONTACT="+998 90 123 45 67"
/// ```
class TrialGuard {
  static const _keyFirstRun = 'trial_first_run_at';
  static const _keyLastSeen = 'trial_last_seen_at';
  static const _keyElapsed = 'trial_elapsed_ms';

  /// Sinov muddati soatlarda. 36 soat = 1.5 kun.
  static const int trialHours =
      int.fromEnvironment('TRIAL_HOURS', defaultValue: 36);

  /// Tekshirish uchun daqiqali override: `--dart-define=TRIAL_MINUTES=3`.
  /// Noldan katta bo'lsa [trialHours] o'rniga shu ishlatiladi — qulfni
  /// yig'ishdan oldin haqiqatan sinab ko'rish uchun.
  static const int trialMinutes =
      int.fromEnvironment('TRIAL_MINUTES', defaultValue: 0);

  /// Qulf ekranida ko'rsatiladigan aloqa ma'lumoti (telefon, Telegram).
  /// Berilmasa ekranda faqat "Contact to developer" qoladi — bu yerga
  /// o'ylab topilgan raqam yozilmaydi.
  static const String contact =
      String.fromEnvironment('TRIAL_CONTACT', defaultValue: '');

  /// `--dart-define=TRIAL_ENABLED=false` bilan butunlay o'chiriladi
  /// (production yig'ilishlar uchun).
  static const bool enabled =
      bool.fromEnvironment('TRIAL_ENABLED', defaultValue: true);

  /// Nusxa fayllarni yozishni o'chiradi: `--dart-define=TRIAL_MIRROR=off`.
  ///
  /// **Faqat testlar uchun.** Nusxalar ataylab ilova papkasidan tashqarida
  /// (`%PROGRAMDATA%` va h.k.) va o'chirishga chidamli — ya'ni Windows'da
  /// test to'plami ularni haqiqatan yozib qo'yadi va keyingi test o'sha
  /// yozuvni o'qib "muddat allaqachon ketgan" deb qoladi. Testlar
  /// bir-birini ifloslantirmasligi uchun shu bayroq bor.
  static const bool mirrorEnabled =
      String.fromEnvironment('TRIAL_MIRROR', defaultValue: 'on') != 'off';

  /// **Mutlaq muddat** — ISO-8601, masalan `2026-08-24T00:00:00Z`.
  /// `--dart-define=TRIAL_DEADLINE=...`
  ///
  /// Nega kerak: [trialHours] qurilmada saqlangan "birinchi ishga tushish"
  /// sanasiga tayanadi, ya'ni ilovani o'chirib qayta o'rnatib muddatni
  /// qaytadan boshlash mumkin. Bu sana esa **binar ichida** — hech qanday
  /// lokal tozalash unga tegmaydi. Qayta o'rnatilgan ilova shu sanadan keyin
  /// darhol qulflanadi.
  ///
  /// Bo'sh qoldirilsa mutlaq muddat yo'q.
  static const String deadlineRaw =
      String.fromEnvironment('TRIAL_DEADLINE', defaultValue: '');

  /// Sana **mahalliy vaqtda** hal bo'ladi:
  /// * `2026-08-18` → 18-avgust soat 00:00, qurilma mintaqasi bo'yicha
  /// * `2026-08-18T00:00:00Z` → `Z` = UTC, Toshkentda soat **05:00**
  /// * `2026-08-18T23:59:59+05:00` → 18-avgust kuni oxirigacha
  static DateTime? get deadline {
    if (deadlineRaw.isEmpty) return null;
    return DateTime.tryParse(deadlineRaw)?.toLocal();
  }

  /// Sana berilgan, lekin o'qib bo'lmadi (masalan `18-08-2026`).
  ///
  /// Bu yig'ishdagi xato. Jimgina "muddat yo'q" deb o'tkazib yuborish eng
  /// yomon yo'l bo'lardi: himoyasiz build mijozga ketib, buni hech kim
  /// sezmasdi. Shuning uchun bunday build **darhol qulflanadi** — xato
  /// birinchi ishga tushirishdayoq ko'rinadi.
  static bool get deadlineInvalid =>
      deadlineRaw.isNotEmpty && DateTime.tryParse(deadlineRaw) == null;

  /// Bir daqiqada bir marta tekshiramiz — qulf ish paytida ham yopilishi
  /// kerak, faqat ilova qayta ochilganda emas.
  static const Duration _tickInterval = Duration(minutes: 1);

  final SharedPreferences _prefs;

  /// Windows'da ilova qayta o'rnatilsa `SharedPreferences` tozalanadi.
  /// Nusxalar ilova papkasidan tashqarida qoladi va sinov muddati qaytadan
  /// boshlanmaydi.
  ///
  /// Bir nechta joy: bittasini o'chirish yetarli bo'lmasligi kerak. Hammasi
  /// o'qiladi, **eng eskisi** haqiqat deb olinadi, yozuv esa hammasiga
  /// boradi — ya'ni bitta nusxa qolsa ham muddat tiklanadi.
  ///
  /// Android'da bunday joy yo'q (o'chirish hamma narsani tozalaydi) —
  /// u yerda [deadline] va POS'ning 423 javobi ushlab turadi.
  final List<File> _mirrors;

  final _controller = StreamController<bool>.broadcast();
  Timer? _timer;

  /// Mutlaq muddat uchun bir martalik taymer. Davriy tik'ning o'zi bilan
  /// qulf belgilangan paytdan keyin bir daqiqagacha kechikardi — kun
  /// aniqligida muhim emas, lekin "soat 18:00 da yopilsin" deyilganda
  /// kechikish ko'zga tashlanadi.
  Timer? _deadlineTimer;

  DateTime? _firstRun;
  DateTime _lastSeen = DateTime.now();
  Duration _elapsed = Duration.zero;
  bool _locked = false;

  TrialGuard._(this._prefs, this._mirrors);

  static Future<TrialGuard> init() async {
    final prefs = await SharedPreferences.getInstance();
    final guard = TrialGuard._(prefs, _mirrorFiles());
    await guard._load();
    guard._startTimer();
    return guard;
  }

  /// Qulf holati o'zgarganda. Faqat `false → true` o'tishi bo'ladi — qulf
  /// hech qachon o'zidan ochilmaydi.
  Stream<bool> get onLockChanged => _controller.stream;

  bool get isLocked => _locked;

  Duration get trial => trialMinutes > 0
      ? const Duration(minutes: trialMinutes)
      : const Duration(hours: trialHours);

  /// Ilova birinchi marta ishga tushgan payt.
  DateTime? get startedAt => _firstRun;

  /// Qulfgacha qolgan vaqt. Tugagan bo'lsa `Duration.zero`.
  ///
  /// Ikki muddatning yaqinrog'i: qurilmadagi hisob va binardagi mutlaq sana.
  Duration get remaining {
    var left = trial - _used;
    final hard = deadline;
    if (hard != null) {
      final untilHard = hard.difference(DateTime.now());
      if (untilHard < left) left = untilHard;
    }
    return left.isNegative ? Duration.zero : left;
  }

  Future<void> dispose() async {
    _timer?.cancel();
    _timer = null;
    _deadlineTimer?.cancel();
    _deadlineTimer = null;
    if (!_controller.isClosed) await _controller.close();
  }

  // ── Hisob ─────────────────────────────────────────────────────────────────

  /// Sarflangan vaqt.
  ///
  /// Ikki o'lchovning **kattasi** olinadi:
  /// * `wall` — birinchi ishga tushishdan hozirgacha (asosiy o'lchov, chunki
  ///   muddat kalendar bo'yicha sanaladi, ishlatilgan soatlar bo'yicha emas);
  /// * `_elapsed` — kuzatilgan oraliqlarning yig'indisi.
  ///
  /// Ikkinchisi soatni orqaga surishga qarshi: tizim vaqti o'tmishga
  /// ko'chirilsa `wall` kichrayadi, lekin `_elapsed` allaqachon to'plangan va
  /// hech qachon kamaymaydi.
  Duration get _used {
    final first = _firstRun;
    final wall =
        first == null ? Duration.zero : DateTime.now().difference(first);
    return wall > _elapsed ? wall : _elapsed;
  }

  Future<void> _load() async {
    if (!enabled) return;

    if (deadlineInvalid) {
      // Debug'da ham, release'da ham chiqadi — bu yig'ish xatosi va uni
      // darhol ko'rish kerak.
      debugPrint(
        '[Trial] TRIAL_DEADLINE o\'qib bo\'lmadi: "$deadlineRaw". '
        'ISO-8601 kutiladi, masalan 2026-08-18 yoki '
        '2026-08-18T23:59:59+05:00. Ilova qulflangan holda ishga tushdi.',
      );
    }

    final mirror = await _readMirror();
    final fromPrefs = _prefs.getInt(_keyFirstRun);
    final fromMirror = mirror?[_keyFirstRun] as int?;

    // Ikki manbadan **eng eskisi** haqiqat. Biri tozalangan bo'lsa ikkinchisi
    // muddatni davom ettiradi.
    int? first;
    if (fromPrefs != null && fromMirror != null) {
      first = fromPrefs < fromMirror ? fromPrefs : fromMirror;
    } else {
      first = fromPrefs ?? fromMirror;
    }

    final now = DateTime.now();
    if (first == null) {
      // Birinchi ishga tushish.
      first = now.millisecondsSinceEpoch;
      _elapsed = Duration.zero;
    } else {
      final ep = _prefs.getInt(_keyElapsed) ?? 0;
      final em = (mirror?[_keyElapsed] as int?) ?? 0;
      _elapsed = Duration(milliseconds: ep > em ? ep : em);

      // Ilova yopiq turgan vaqt ham sanaladi: oxirgi ko'rilgan paytdan
      // hozirgacha bo'lgan oraliq qo'shiladi. Busiz demo qurilmani kechqurun
      // o'chirib qo'yish muddatni cho'zardi.
      final lastSeenMs = _prefs.getInt(_keyLastSeen) ??
          (mirror?[_keyLastSeen] as int?) ??
          first;
      final gap = now.millisecondsSinceEpoch - lastSeenMs;
      if (gap > 0) _elapsed += Duration(milliseconds: gap);
    }

    _firstRun = DateTime.fromMillisecondsSinceEpoch(first);
    _lastSeen = now;
    await _persist();
    _evaluate();

    if (kDebugMode) {
      debugPrint(
        '[Trial] boshlangan: $_firstRun, sarflangan: $_used / $trial, '
        'qulf: $_locked',
      );
    }
  }

  void _startTimer() {
    if (!enabled) return;
    _timer?.cancel();
    _timer = Timer.periodic(_tickInterval, (_) => _tick());

    _deadlineTimer?.cancel();
    final hard = deadline;
    if (hard == null) return;
    final wait = hard.difference(DateTime.now());
    if (wait.isNegative) return;
    // Bir soniya zaxira: taymer aynan chegarada uyg'onsa `isBefore`
    // tekshiruvi hali "kelmagan" deb qaytishi mumkin.
    _deadlineTimer = Timer(wait + const Duration(seconds: 1), _tick);
  }

  void _tick() {
    final now = DateTime.now();
    final delta = now.difference(_lastSeen);
    // Manfiy oraliq — soat orqaga surilgan. Vaqt qo'shilmaydi, lekin
    // to'plangani ham kamaymaydi.
    if (!delta.isNegative) _elapsed += delta;
    _lastSeen = now;
    unawaited(_persist());
    _evaluate();
  }

  void _evaluate() {
    if (!enabled) return;

    // Uch sabab. Birinchisini lokal tozalash bilan qaytarish mumkin,
    // qolgan ikkisini — yo'q: ular binar ichida.
    final hard = deadline;
    final locked = deadlineInvalid ||
        _used >= trial ||
        (hard != null && !DateTime.now().isBefore(hard));

    if (locked == _locked) return;
    _locked = locked;
    if (!_controller.isClosed) _controller.add(locked);
  }

  // ── Saqlash ───────────────────────────────────────────────────────────────

  Future<void> _persist() async {
    final first = _firstRun;
    if (first == null) return;
    final data = {
      _keyFirstRun: first.millisecondsSinceEpoch,
      _keyLastSeen: _lastSeen.millisecondsSinceEpoch,
      _keyElapsed: _elapsed.inMilliseconds,
    };

    await _prefs.setInt(_keyFirstRun, data[_keyFirstRun]!);
    await _prefs.setInt(_keyLastSeen, data[_keyLastSeen]!);
    await _prefs.setInt(_keyElapsed, data[_keyElapsed]!);

    // Har bir nusxa alohida yoziladi: bittasi yozilmasa (huquq yo'q, disk
    // to'la) qolganlari baribir yangilanadi.
    final payload = _encode(data);
    for (final mirror in _mirrors) {
      try {
        await mirror.parent.create(recursive: true);
        await mirror.writeAsString(payload, flush: true);
      } catch (_) {
        // Nusxa faqat qo'shimcha himoya — u yozilmasa ham ilova ishlashi
        // kerak, prefs allaqachon yozilgan.
      }
    }
  }

  /// Hamma nusxadan **eng erta** `firstRun` va **eng katta** `elapsed`.
  ///
  /// Bittasi o'chirilgan yoki qo'lda tahrirlangan bo'lsa qolganlari
  /// haqiqatni saqlaydi.
  Future<Map<String, dynamic>?> _readMirror() async {
    Map<String, dynamic>? best;
    for (final mirror in _mirrors) {
      final one = await _readOne(mirror);
      if (one == null) continue;
      if (best == null) {
        best = one;
        continue;
      }
      final bf = best[_keyFirstRun] as int? ?? 0;
      final of = one[_keyFirstRun] as int? ?? 0;
      final be = best[_keyElapsed] as int? ?? 0;
      final oe = one[_keyElapsed] as int? ?? 0;
      final bl = best[_keyLastSeen] as int? ?? 0;
      final ol = one[_keyLastSeen] as int? ?? 0;
      best = {
        _keyFirstRun: of < bf ? of : bf,
        _keyElapsed: oe > be ? oe : be,
        _keyLastSeen: ol < bl ? ol : bl,
      };
    }
    return best;
  }

  Future<Map<String, dynamic>?> _readOne(File mirror) async {
    try {
      if (!await mirror.exists()) return null;
      final decoded = _decode(await mirror.readAsString());
      return decoded;
    } catch (_) {
      return null;
    }
  }

  /// Nusxalar joyi. Uchalasi ham ilova papkasidan tashqarida — ilovani
  /// o'chirib qayta o'rnatish ularga tegmaydi.
  ///
  /// Faqat Windows: Android'da ilova o'chirilganda uning yozgan hamma
  /// narsasi tozalanadi va ruxsatsiz saqlanadigan joy yo'q. U yerda
  /// [deadline] yagona ishonchli to'siq.
  static List<File> _mirrorFiles() {
    if (!mirrorEnabled) return const [];
    if (!Platform.isWindows) return const [];
    const sep = r'\';
    final roots = <String?>[
      Platform.environment['PROGRAMDATA'],
      Platform.environment['APPDATA'],
      Platform.environment['USERPROFILE'],
    ];
    final files = <File>[];
    for (final root in roots) {
      if (root == null || root.isEmpty) continue;
      files.add(File('$root${sep}MaryAI$sep.state'));
    }
    return files;
  }

  // ── Kodlash ───────────────────────────────────────────────────────────────

  /// Nusxa oddiy JSON emas: sana ko'rinib turgan faylni qo'lda tuzatib
  /// muddatni cho'zish juda oson bo'lardi. Base64 + nazorat yig'indisi —
  /// himoya emas, lekin tasodifiy tahrirni yaroqsiz qiladi va tahrirlangan
  /// nusxa o'qilmaydi (qolganlari haqiqatni saqlaydi).
  static String _encode(Map<String, int> data) {
    final json = jsonEncode(data);
    return base64Encode(utf8.encode('${_checksum(json)}|$json'));
  }

  static Map<String, dynamic>? _decode(String raw) {
    try {
      final text = utf8.decode(base64Decode(raw.trim()));
      final sep = text.indexOf('|');
      if (sep <= 0) return null;
      final sum = int.tryParse(text.substring(0, sep));
      final json = text.substring(sep + 1);
      if (sum == null || sum != _checksum(json)) return null;
      final decoded = jsonDecode(json);
      return decoded is Map ? decoded.cast<String, dynamic>() : null;
    } catch (_) {
      return null;
    }
  }

  static int _checksum(String s) {
    var h = 2166136261;
    for (final c in s.codeUnits) {
      h = ((h ^ c) * 16777619) & 0x7FFFFFFF;
    }
    return h;
  }
}
