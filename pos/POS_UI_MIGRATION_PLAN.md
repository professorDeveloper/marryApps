# POS UI Migration Plan — 15"–24" Landscape Touchscreen

## Context

Mary Ai POS hozir Windows POS monoblok va katta dev mashinalarda ishlamoqda. Kelayotgan
real foydalanuvchilarning qurilmalari ikki guruhga bo'linadi:

- **Compact POS** (1024×768 → 1366×768) — entry-level POS terminal yoki
  past-byudjetli landscape monoblok
- **Comfortable POS** (1366×768+ → 1920×1080) — zamonaviy 17–24" sensorli monoblok

Asosiy maqsad: **bir kod bazasi**'da har ikkala class'da ham qulay ishlash —
"compact rejimida hech narsa overflow bo'lmasin", "comfortable rejimida ortiqcha
bo'sh joy bilan tarqoq ko'rinmasin".

Bu plan **2 fazadan** iborat:

- **FAZA 1 (hozir)**: Design System fundamenti — `pos_dimensions`, `pos_typography`,
  `pos_theme`, `responsive_breakpoints`. Ekran kodi o'zgartirilmaydi.
- **FAZA 2 (keyingi sessiyalarda, screen-by-screen)**: Har bir ekranni mavjud kodni
  saqlab, design system konstantalariga ko'chirish + responsive tweaks (paddings,
  touch targets, font sizes).

---

## Hozirgi ekranlar holati (16 screen audit)

Tahlil natijasi (Explore agent + manual review):

| Holati | Soni | Ekranlar |
|--------|------|----------|
| **done** (POS-ready, faqat polish) | 8 | login_pin, splash, archive, close_shift, menu_manage, payment, main (router), notification |
| **partial** (responsive tweak kerak) | 8 | login, cashier, detail, menu_meals_list, admin_floor_plan, waiter_floor_plan, settings, waiter |

Hech bir ekran "todo" (to'liq qaytadan) emas — hammasi yetarli darajada strukturalashgan.

### Asosiy gap'lar (Faza 2 da hal qilinadi)

| Ekran | Asosiy gap |
|------|-----------|
| login | Max-width 400px container kattaroq ekranlarda kichik qoladi; klaviatura tugma o'lchamlari |
| cashier | Tab kontentlari (DishesTab/KassaTab/BillsTab/SettingsTab) audit kerak |
| detail | ProductGridWidget va sidebar ustun soni 1024–1920 oralig'ida tekshirilmagan |
| menu_meals_list | Kategoriyalar ustuni va goods grid 1366 da kompakt, 1920 da bo'sh joy ko'p |
| admin/waiter floor plan | Canvas ichidagi stol tap zonalari va shriftlari hardcoded — scale qilmaydi |
| settings | Sidenav kengligi va subsection layoutlari turli — hammasini ds dan o'tkazish |
| waiter | 4 ustunli (Sidebar+Bills+Menu+Detail) layout — panellar kontenti tekshirilmagan |

---

## FAZA 1 — Design System (HOZIR bajariladi)

### Yangi papka tuzilishi

```
lib/core/design_system/
├── pos_dimensions.dart        # touch targets, paddings, radii, panel widths
├── pos_typography.dart        # POS shrift hierarchy (16/18/20/24/28/36+)
├── pos_theme.dart             # high-contrast light theme + helpers
├── pos_breakpoints.dart       # isCompactPos / isComfortablePos / isLargePos
└── pos_design_system.dart     # barrel export (`import 'pos_design_system.dart';`)
```

### 1.1 `pos_dimensions.dart` — barcha o'lchamlar

```dart
class PosDimensions {
  PosDimensions._();

  // Touch targets (POS sensorli ekran uchun standartdan kattaroq)
  static const double touchTargetMin = 56.0;          // mahalliy mas. icon button
  static const double touchTargetComfortable = 64.0;  // primary tugmalar
  static const double touchTargetLarge = 80.0;        // numpad, asosiy CTA

  // Tugma balandliklari
  static const double buttonHeightSm = 40.0;          // ikkinchi darajali
  static const double buttonHeightMd = 56.0;          // standart
  static const double buttonHeightLg = 64.0;          // primary
  static const double buttonHeightXl = 80.0;          // checkout/numpad

  // Panel kengliklari (compact/comfortable)
  static const double sidebarWidthCompact = 180.0;    // 1024–1366
  static const double sidebarWidthComfortable = 240.0;// 1366+
  static const double cartPanelCompact = 320.0;       // 1024–1366
  static const double cartPanelComfortable = 400.0;   // 1366+

  // Grid: hozirgi menu_meals_list bilan mos
  static const double gridItemMinWidth = 160.0;       // compact
  static const double gridItemMinWidthLg = 200.0;     // comfortable

  // App chrome
  static const double appBarHeight = 64.0;
  static const double subBarHeight = 56.0;            // OrderActionsBar
  static const double bottomBarHeight = 88.0;

  // Radii
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;

  // Spacing scale (4px grid)
  static const double xs = 4.0;
  static const double s = 8.0;
  static const double m = 12.0;
  static const double l = 16.0;
  static const double xl = 20.0;
  static const double xxl = 24.0;
  static const double xxxl = 32.0;

  // Page paddings (compact/comfortable)
  static const double pagePaddingCompact = 16.0;
  static const double pagePaddingComfortable = 24.0;
}
```

### 1.2 `pos_typography.dart` — POS shrift ierarxiyasi

POS terminalda kassir 30–50 sm masofada. **Hech qanday < 13sp shrift yo'q**.

```dart
class PosTypography {
  PosTypography._();

  // Body (asosiy o'qiladigan matnlar)
  static const double bodySm = 13.0;     // 2-darajali matnlar
  static const double bodyMd = 15.0;     // default body (avval 13–14 edi)
  static const double bodyLg = 17.0;     // muhim body

  // Tugma matnlari
  static const double buttonSm = 14.0;
  static const double buttonMd = 16.0;
  static const double buttonLg = 18.0;   // primary tugma

  // Sarlavhalar
  static const double headlineSm = 20.0;
  static const double headlineMd = 24.0;
  static const double headlineLg = 28.0;

  // Narxlar va summa (eng katta o'qiladigan element)
  static const double priceMd = 18.0;    // mahsulot kartasi
  static const double priceLg = 24.0;    // savatchadagi narx
  static const double totalAmount = 32.0; // checkout total

  // Compact ekran (1024×768) uchun korreksiya
  static double scaledFor(double base, double width) {
    if (width < 1280) return base * 0.92;   // ~8% kichikroq
    return base;
  }

  // Default font family
  static const String family = 'Inter';

  // FontFeatures: tabular figures barcha raqamlar uchun
  static const fontFeatures = [FontFeature.tabularFigures()];
}
```

### 1.3 `pos_theme.dart` — high-contrast light theme

Hozirgi `AppTheme.lightTheme` saqlanib qoladi (legacy compat). Yangi
`PosTheme.light()` qo'shiladi:

- **Surface**: `#FFFFFF`, `bgSecondary` `#F8FAFC`
- **Text**: `#0F172A` (asosiy), `#64748B` (ikkinchi), `#94A3B8` (uchinchi)
- **Brand accent**: `#FB6633` (mavjud), saturation < 80%
- **Success**: `#16A34A`, **Error**: `#DC2626`, **Warning**: `#F59E0B`
- **Border**: `#E2E8F0`, `#CBD5E1` (kuchli)
- Disabled state: opacity 0.5 + grayscale background — kafe yorug'ida ham aniq farq

### 1.4 `pos_breakpoints.dart`

```dart
class PosBreakpoints {
  PosBreakpoints._();

  static const double compactMin = 1024.0;
  static const double compactMax = 1366.0;
  static const double comfortableMin = 1366.0;
  static const double largeMin = 1600.0;

  static bool isCompactPos(BuildContext c) {
    final w = MediaQuery.sizeOf(c).width;
    return w >= compactMin && w < comfortableMin;
  }

  static bool isComfortablePos(BuildContext c) =>
      MediaQuery.sizeOf(c).width >= comfortableMin;

  static bool isLargePos(BuildContext c) =>
      MediaQuery.sizeOf(c).width >= largeMin;

  /// Helper: ikki qiymat orasida tanlash
  static T pick<T>(BuildContext c, {required T compact, required T comfortable}) =>
      isCompactPos(c) ? compact : comfortable;
}
```

### 1.5 Barrel export

`pos_design_system.dart`:

```dart
export 'pos_dimensions.dart';
export 'pos_typography.dart';
export 'pos_theme.dart';
export 'pos_breakpoints.dart';
```

### 1.6 Verification (Faza 1)

- [ ] `flutter analyze` → no issues
- [ ] Yangi 5 fayl yaratilgan, mavjud kod o'zgartirilmagan
- [ ] `pos_design_system.dart` import qilinadi va barcha eksport ishlaydi
- [ ] Birorta ekran kodida hech qanday o'zgarish bo'lmaydi (hozircha)

---

## FAZA 2 — Screen-by-screen migration (KEYINGI sessiyalarda)

Plan tasdiqlangandan keyin har bir ekran alohida sessiyada DS ga ko'chiriladi.
Tartib (eng katta foyda → eng kichik):

### Sprint A (yuqori ta'sir — 3 sessiya)
1. **detail_screen** — eng ko'p ishlatiladigan ekran. Sidebar/grid kengliklarini DS dan,
   touch targetlar `PosDimensions.touchTargetMin` ga, shriftlar
   `PosTypography.bodyMd`/`buttonMd` ga.
2. **payment_screen** — numpad tugmalarini `PosDimensions.touchTargetLarge`,
   total `PosTypography.totalAmount`, panel kengliklari DS dan.
3. **menu_meals_list_screen** — grid `PosDimensions.gridItemMinWidth` /
   `gridItemMinWidthLg` orqali compact/comfortable o'rtasida.

### Sprint B (admin oqimi — 2 sessiya)
4. **archive_screen** — filter pillar va metric cardlar DS spacing'ga.
5. **settings_screen** — sidenav `sidebarWidthCompact/Comfortable`, subsection
   paddings DS dan.

### Sprint C (auth + qo'shimcha — 2 sessiya)
6. **login** + **login_pin** + **splash** — virtual klaviatura tugmalari
   `touchTargetLarge`.
7. **notification** + **menu_manage** + **close_shift** — minor polish.

### Sprint D (canvas + waiter — 2 sessiya)
8. **admin_floor_plan_screen** + **waiter_floor_plan_screen** — canvas tap
   zonalari `touchTargetMin` ga, shriftlar DS dan.
9. **waiter_screen** + **cashier_screen** — 4-ustunli/tab layoutlarini DS dan.

**Jami Faza 2 effort**: ~9 sessiya, har biri 1–3 soat.

---

## Kritik fayllar (Faza 1 da yaratiladi)

| Fayl | Sabab |
|------|-------|
| [lib/core/design_system/pos_dimensions.dart](lib/core/design_system/pos_dimensions.dart) | YANGI — barcha o'lchamlar |
| [lib/core/design_system/pos_typography.dart](lib/core/design_system/pos_typography.dart) | YANGI — POS shrift ierarxiyasi |
| [lib/core/design_system/pos_theme.dart](lib/core/design_system/pos_theme.dart) | YANGI — high-contrast theme |
| [lib/core/design_system/pos_breakpoints.dart](lib/core/design_system/pos_breakpoints.dart) | YANGI — responsive helperlar |
| [lib/core/design_system/pos_design_system.dart](lib/core/design_system/pos_design_system.dart) | YANGI — barrel export |

Mavjud `lib/core/values/app_colors.dart`, `lib/core/extension/for_context.dart` saqlanadi
(legacy compat). DS bilan parallel ishlaydi — Faza 2 da ekranlar bittadan ko'chiriladi.

---

## Qayta ishlatiladigan mavjud kod

- `context.colors.*` — hozirgi rang sxemasi (dark/light) — saqlanadi.
  `pos_theme.dart` qaytarish o'rniga shu helper'ga `PosTheme.colors(c)` qo'shiladi.
- `formatN` extension (so'm format) — saqlanadi
- L10n keys (`S.current.str*`) — saqlanadi
- Mavjud `context.h` / `context.w` (extension) — saqlanadi (PosBreakpoints
  ularning ichida ham ishlaydi)

---

## Verification (Faza 1)

```bash
# 1. Analyze toza ekanligini tasdiqlash
flutter analyze lib/core/design_system/

# 2. Mavjud kodga ta'sir qilmagan
git diff --stat | head
# Faqat 5 ta yangi fayl ko'rinishi kerak, hech qanday "M" yo'q

# 3. Build ishlayotganini tekshirish
flutter build macos --debug --no-codesign 2>&1 | tail -5
# yoki: flutter build windows --debug

# 4. Keyingi sprint'da 1 ta ekranni DS ga ko'chirib pilot qilish
# (mas. detail_screen.dart) — yashil bo'lsa qolgan ekranlarga rejani davom ettirish
```

---

## Tasdiqlashdan keyin

1. Bu hujjat tasdiqlangach, men 5 ta DS faylini yarataman
2. `flutter analyze` ishga tushiraman
3. `flutter-verify` skill bilan to'liq tekshiruv
4. Sizga commit'ga tayyor diff ko'rsataman
5. Sprint A boshlash uchun yangi sessiya kerak bo'lsa, men eslataman
