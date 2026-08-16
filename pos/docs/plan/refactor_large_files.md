# Refactor: Katta fayllarni widgetlarga ajratish

**Maqsad:** Har bir fayl maksimum 400–500 qator bo'lsin. Har bir widget o'z fayliga chiqarilsin.

---

## Refactor qilinadigan fayllar

### 1. `halls_tables_section.dart` — 2785 qator
**Joyi:** `lib/features/view/main/presentation/pages/settings/sections/`

Ajratiladigan widgetlar:
- `widgets/hall_list_panel.dart` — zal ro'yxati + qo'shish tugmasi
- `widgets/hall_editor_dialog.dart` — zal qo'shish/tahrirlash dialogi
- `widgets/table_list_panel.dart` — stol ro'yxati + qo'shish tugmasi
- `widgets/table_editor_dialog.dart` — stol qo'shish/tahrirlash dialogi
- `widgets/table_card.dart` — bitta stol kartasi (drag, resize, shape)
- `widgets/floor_plan_preview.dart` — floor plan ko'rinishi (canvas preview)

---

### 2. `menu_manage_screen.dart` — 1880 qator
**Joyi:** `lib/features/view/main/presentation/pages/menu/`

Ajratiladigan widgetlar:
- `widgets/category_panel.dart` — kategoriyalar ro'yxati + CRUD
- `widgets/category_editor_dialog.dart` — kategoriya dialogi
- `widgets/meal_grid.dart` — taomlar grid ko'rinishi
- `widgets/meal_card.dart` — bitta taom kartasi
- `widgets/meal_editor_dialog.dart` — taom qo'shish/tahrirlash dialogi (rasm, narx, tarjima)

---

### 3. `bill_detail_panel.dart` — 1790 qator
**Joyi:** `lib/features/view/main/presentation/pages/waiter/widgets/`

Ajratiladigan widgetlar:
- `bill_items_list.dart` — buyurtma elementlari ro'yxati
- `bill_payment_section.dart` — to'lov qismi (naqd/karta/aralash)
- `bill_summary_footer.dart` — jami, chegirma, servis summasi
- `bill_action_buttons.dart` — print, to'lash, bekor qilish tugmalari

---

### 4. `menu_meals_list_screen.dart` — 1461 qator
**Joyi:** `lib/features/view/main/presentation/pages/menu/`

Ajratiladigan widgetlar:
- `widgets/meals_filter_bar.dart` — qidiruv + kategoriya filtri
- `widgets/meals_grid_view.dart` — taomlar gridi
- `widgets/meal_list_item.dart` — ro'yxat ko'rinishidagi taom

---

### 5. `printers_section.dart` — 1373 qator
**Joyi:** `lib/features/view/main/presentation/pages/settings/sections/`

Ajratiladigan widgetlar:
- `widgets/printer_list_panel.dart` — printer ro'yxati
- `widgets/printer_editor_dialog.dart` — printer qo'shish/tahrirlash
- `widgets/printer_test_button.dart` — test chop etish
- `widgets/lan_device_scanner.dart` — LAN tarmoqdan qurilma qidirish

---

## Qoidalar

- Har bir fayl **400–500 qatordan** oshmasin
- Widget nomi fayl nomiga mos bo'lsin (`HallListPanel` → `hall_list_panel.dart`)
- Asosiy fayl (`halls_tables_section.dart`) faqat **import + compose** qilsin
- Private (`_`) widgetlarni alohida faylga chiqarishda `_` prefiksini olib tashla
- Shared bo'lgan widgetlar `core/components/` ga o'tsin

## Tartibi

- [ ] halls_tables_section.dart
- [ ] menu_manage_screen.dart
- [ ] bill_detail_panel.dart
- [ ] menu_meals_list_screen.dart
- [ ] printers_section.dart
